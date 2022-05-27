//amount of zoom caused by one scroll movement
const zoomSensitivity = 0.1;
//current scale of canvas
let currentScale = 6e-7;
//current displacement of canvas in x and y axis
let transformX = -2000;
let transformY = -2000;
//if mouse has been dragged
let isMouseDragged = false;
//coords of point where mouse has been pressed
let mousePressedX = null;
let mousePressedY = null;
//mouse needs to be dragged by more than this value to consider it mouse drag
const mouseDragDetectionThreshold = 10;
//position of green dot indicating starting position of simulation
let green_posx=4080000000;
let green_posy=3970000000;
//object for aborting fetch requests
var abort_controller = new AbortController();
var signal = abort_controller.signal;
//contains trajectory points used for drawing trajectory curve
var points=[];

//p5.js function, creates canvas and loads images
function setup() 
{
  c=createCanvas(1000, 1000);
  c.parent('canvas_holder');
  img_sun=loadImage('static/oil_sun.png');
  img_mercury = loadImage('static/oil_mercury.png');
  img_venus = loadImage('static/oil_venus.png');
  img_earth = loadImage('static/oil_earth.png');
  img_mars = loadImage('static/oil_mars.png');
  img_jupiter = loadImage('static/oil_jupiter.png');
  img_saturn = loadImage('static/oil_saturn.png');
  img_uranus = loadImage('static/oil_uranus.png');
  img_neptune = loadImage('static/oil_neptune.png');
  planet_imgs=[img_mercury,img_venus,img_earth,img_mars,img_jupiter,img_saturn,img_uranus,img_neptune];
  bg=loadImage('static/background_sky.png');
}

//get initial positions of planets
var planets;
getSolarData().then(x=>{planets=x;})
planet_radius=[2440,6051,6378,3396,71492,60268,25559,24764];
planet_names=["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"];

//p5.js function, handles rendering on canvas
function draw() 
{
  fill(255);
  stroke(255);
  strokeWeight(1);
  //paint background
  background(bg);

  //setup transformation matrices, renderings after are affected by them
  push();
  translate(transformX, transformY);
  scale(currentScale);

  //render image of sun
  image(img_sun,3999303660,3999303660,1392680,1392680);
  //reder images of planets
  if(planets!==undefined)
  {
    for(i=0;i<8;i++)
    {
      image(planet_imgs[i],planets[i].x-Math.round(planet_radius[i]/2),planets[i].y-Math.round(planet_radius[i]/2),Math.round(planet_radius[i]*2),Math.round(planet_radius[i]*2));
    }
  }
  //rendering beyond this point are not affected by transform matrices
  pop();

  //render "Sun" text which is of constant size
  textSize(30);
  text("Sun",(4000000000*currentScale)+transformX,(4000000000*currentScale)+transformY);
  //render planet names which are of constant size
  if(planets!==undefined)
  {
    for(i=0;i<8;i++)
    {
      textX=planets[i].x*currentScale;
      textY=planets[i].y*currentScale;
      text(planet_names[i],textX+transformX,textY+transformY);
    }
  }

  //render trajectory of body, by painting curves between points, trajectory is of constant size, unaffected by zoom
  //curve is drawn between two points (arg3,arg4) and (arg5,arg6) but to have the right shape we need point from which
  //curve seems to be coming from (arg1,arg2) and point to which curve seems to be going to (arg7,arg8)
  noFill();
  strokeWeight(7);
  if(points !==undefined)
  {
    //needs at least 3 points in array to draw a curve, so we can copy the last point if there are anly 2
    if(points.length==2)
    {
      points.push(points[1]);
    }
    len=points.length;
    for(i=0;i<len-1;i++)
    {
      if(i==0)
      {
        curve((points[0].x*currentScale)+transformX,(points[0].y*currentScale)+transformY,
        (points[0].x*currentScale)+transformX,(points[0].y*currentScale)+transformY,
        (points[1].x*currentScale)+transformX,(points[1].y*currentScale)+transformY,
        (points[2].x*currentScale)+transformX,(points[2].y*currentScale)+transformY);
      }
      else
      { 
        if(i==len-2)
        {
          curve((points[i-1].x*currentScale)+transformX,(points[i-1].y*currentScale)+transformY,
          (points[i].x*currentScale)+transformX,(points[i].y*currentScale)+transformY,
          (points[i+1].x*currentScale)+transformX,(points[i+1].y*currentScale)+transformY,
          (points[i+1].x*currentScale)+transformX,(points[i+1].y*currentScale)+transformY);
        }
        else
        {
          curve((points[i-1].x*currentScale)+transformX,(points[i-1].y*currentScale)+transformY,
          (points[i].x*currentScale)+transformX,(points[i].y*currentScale)+transformY,
          (points[i+1].x*currentScale)+transformX,(points[i+1].y*currentScale)+transformY,
          (points[i+2].x*currentScale)+transformX,(points[i+2].y*currentScale)+transformY);
        }
      }
    }
  }

  //render green dot which is the starting position of simulation, not affected by zoom
  fill(0,255,0);
  strokeWeight(0);
  ellipse((green_posx*currentScale)+transformX,(green_posy*currentScale)+transformY,10,10);
}

//p5.js calls this function, remembers where mouse has been pressed
function mousePressed() 
{
  mousePressedX = mouseX;
  mousePressedY = mouseY;
}

//p5.js calls this function, if mouse dragged over canvas, change transform values
function mouseDragged() 
{
  if(mouseX <= width && mouseX >= 0 && mouseY <= height && mouseY >= 0)
  {
    if (dist(mousePressedX, mousePressedY, mouseX, mouseY) > mouseDragDetectionThreshold) {
      isMouseDragged = true;
      transformX += (mouseX - pmouseX);
      transformY += (mouseY - pmouseY);
    }
  }
}

//p5.js calls this function, if mouse released over canvas without dragging, move starting position(green dot) to this position
function mouseReleased() 
{
  if (!isMouseDragged) 
  {
    if(mousePressedX <= width && mousePressedX >= 0 && mousePressedY <= height && mousePressedY >= 0)
    {
      //values need to be transformed from canvas space to values that can be used with simulation
      getPosFromCanvas(round((mousePressedX-transformX)/currentScale)-4000000000,round((mousePressedY-transformY)/currentScale)-4000000000);
    }
  }
  mousePressedX = null;
  mousePressedY = null;
  isMouseDragged = false;
}

//p5.js calls this function, changes canvas scale if scroll has been moved over canvas
function mouseWheel(event) 
{
  if(mouseX <= width && mouseX >= 0 && mouseY <= height && mouseY >= 0)
  {
    //determine the scale factor based on zoom sensitivity
    let scaleFactor = null;
    if (event.delta < 0) {
      scaleFactor = 1 + zoomSensitivity;
    } else {
      scaleFactor = 1 - zoomSensitivity;
    }

    //apply transformation and scale incrementally
    currentScale = currentScale * scaleFactor;
    transformX = mouseX - (mouseX * scaleFactor) + (transformX * scaleFactor);
    transformY = mouseY - (mouseY * scaleFactor) + (transformY * scaleFactor);
  
    //disable page scroll if on canvas
    return false;
  }
  return true;
}