//GET method for getting initial positions of planets on page load
async function getSolarData()
{
    const response = await fetch(window.location.href+'getsolar');
    const data=await response.json();
    return data;
}

//POST method to get new positions of planets after user changed plaent anomalies
async function updatedSolarData()
{
    const rawResponse = await fetch(window.location.href+'updatedsolar', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({p1: parseInt(document.getElementById("p1_slider").value),
        p2: parseInt(document.getElementById("p2_slider").value),
        p3: parseInt(document.getElementById("p3_slider").value),
        p4: parseInt(document.getElementById("p4_slider").value),
        p5: parseInt(document.getElementById("p5_slider").value),
        p6: parseInt(document.getElementById("p6_slider").value),
        p7: parseInt(document.getElementById("p7_slider").value),
        p8: parseInt(document.getElementById("p8_slider").value),
        })
    })
    const content = await rawResponse.json().then(x=>{planets=x;});
}

//POST method to change starting position of simulation
async function postCoords(x_pos,y_pos,x_vel,y_vel)
{
    const rawResponse = await fetch(window.location.href+'postcoords', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({xp: x_pos, yp: y_pos, xv: x_vel, yv: y_vel})
    });
    const content = await rawResponse.json();

    return content;
}

//GETs segments of trajectory one by one, 1 whole segemnt=10 days(864000 seconds), leftover=seconds that dont add up to 10 days
async function getTrajPart(whole,leftover)
{
    //button that can be pressed to cancel the process of getting segments
    btn=document.getElementById("cancel_button");
    //text that says how many segments are already calculated and displayed
    progress_text=document.getElementById("progress_text");
    segments=0;
    segments_done=0;
    if(leftover>0) segments=whole+1;
    else segments=whole;
    //change text to let user know that we started calculating the trajectory
    progress_text.innerHTML="0 out of "+segments+" segments";
    //if user have aborted the fetch
    was_aborted=false;
    while(whole>0)
    {
        //tell server to simulate for 10 days and add recived data to points array, unless aborted
        const response = await fetch(window.location.href+'getpart/'+864000,{signal: signal}).catch(function(err) 
        {
            leftover=0;
            whole=0;
            was_aborted=true;
        });
        //if one fetch was aborted, then we dont want any more segments
        if(was_aborted) break;
        const data=await response.json();
        points=points.concat(data);
        whole--;
        //update text after segment have been succesfully calculated 
        segments_done++;
        progress_text.innerHTML=segments_done+" out of "+segments+" segments";
    }
    if(leftover>0)
    {
        //tell server to simulate for leftover number of seconds and add recived data to points array, unless aborted
        const response = await fetch(window.location.href+'getpart/'+leftover,{signal: signal}).catch(function(err) 
        {
            leftover=0;
            was_aborted=true;
        });
        //if fetch was aborted then we have nothing to add to points array
        if(was_aborted) return;
        const data=await response.json();
        points=points.concat(data);
    }

    //we recived all segments, so cancel button and progress text becomes invisible
    btn.style="display: none;";
    btn.disabled=true;
    progress_text.innerHTML="";
}

//when Calculate button is pressed, then we want to calculate new trajectory with data inputed byu user
async function calculateTraj()
{
    //make new signal for possible abortion of fetch
    //each signal can be used only once
    abort_controller = new AbortController();
    signal = abort_controller.signal;

    //make the cancel button visible
    btn=document.getElementById("cancel_button");
    btn.removeAttribute("style");
    btn.disabled=false;

    //get data from inputs
    px=document.getElementById("posx").value;
    py=document.getElementById("posy").value;
    vx=document.getElementById("velx").value;
    vy=document.getElementById("vely").value;
    time=parseInt(document.getElementById("time_amount").value);
    //divide trajectory into segments, 86400 seconds is 10 days of simualtion
    leftover=time%864000;
    whole_parts=(time-leftover)/864000;
    //send new coords to the server
    const promise= await postCoords(parseInt(px),parseInt(py),parseFloat(vx),parseFloat(vy));
    //clear points array form previous trajectory
    points=[];
    //start sending requests for segments
    getTrajPart(whole_parts,leftover);
}

//udate position of green dot if user pressed mouse somewhere on the canvas
function getPosFromCanvas(x,y)
{
    document.getElementById("posx").value=x;
    document.getElementById("posy").value=y;
    green_posx=x+4000000000;
    green_posy=y+4000000000;
}

//update position of green dot if user changed value in position input
function posChanged()
{
    green_posx=parseInt(document.getElementById("posx").value)+4000000000;
    green_posy=parseInt(document.getElementById("posy").value)+4000000000;
}

//called when user presses cancel button
function abortCalculatingTraj()
{
    //make cancel button and text invisible
    btn=document.getElementById("cancel_button");
    btn.style="display: none;";
    btn.disabled=true;
    document.getElementById("progress_text").innerHTML="";
    //send abort signal to fetch reqests
    abort_controller.abort();
    //clear array of points
    points=[];
}

//update text if user moved anomaly slider
function sliderChanged(sender,paragraph)
{
    paragraph.innerHTML=sender.value;
}