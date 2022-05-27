import numpy as np
from flask import Flask, jsonify, request, render_template, session
from flask_session import Session
from trajectory import Simulation
from rdp import rdp

#create Flask app and configure session
app=Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

#root route, resets session variables and renders html template
@app.route("/")
def load_site():
    session['xp']=0
    session['yp']=0
    session['xv']=0
    session['yv']=0
    session['anomalies']=[0,0,0,0,0,0,0,0]
    return render_template("base.html")

#returns json with trajectory points, after simulating for <seconds> seconds, using session variables
#as starting values
@app.route("/getpart/<seconds>",methods=['GET'])
def send_traj_data(seconds):
    if request.method=="GET":
        #create Simulation object
        sim=Simulation(np.array([session['xp'],session['yp']]),np.array([session['xv'],session['yv']]))
        #get planet anomalies from session and set coords of planets using them
        anm=session['anomalies']
        for i in range(1,9):
            sim.solar_bodies[i].set_heliocentric_coords(anm[i-1])
        message=[]
        #simulate for number of seconds
        pos_points=sim.simulate_for(int(seconds))
        #update session variables to endpoint of simulation, so we can pick up where we ended in later request
        session['xp']=sim.sim_body_pos[0]
        session['yp']=sim.sim_body_pos[1]
        session['xv']=sim.sim_body_vel[0]
        session['yv']=sim.sim_body_vel[1]
        #decimate curve using Ramer-Douglas-Peucker Algorithm
        pos_points=rdp(pos_points,epsilon=7000)
        #construct list with points of trajectory and send it
        #in simulation point (0,0) is in the middle where sun is, but in p5.js canvas (0,0) is in left top corner
        #add 4000000000 to simulation positions so points will display correctly on p5.js canvas
        for i in range(len(pos_points)):
            message.append({"x":round(pos_points[i,0]+4000000000),"y":round(pos_points[i,1]+4000000000)})
        return jsonify(message)

#returns positions of planets when true anomaly of every planet =0 (on page load)
@app.route("/getsolar",methods=['GET'])
def send_solar_data():
    if request.method=="GET":
        #create simulation object
        sim=Simulation(np.array([session['xp'],session['yp']]),np.array([session['xv'],session['yv']]))
        message=[]
        #get orbital positions and send them in json
        for i in range(1,9):
            orbital_pos=sim.get_orbital_pos(i)
            message.append({"x":round(orbital_pos[0]+4000000000),"y":round(orbital_pos[1]+4000000000)})
        return jsonify(message)

#changes anomaly values in session and returns position of planets with given anomalies
@app.route("/updatedsolar",methods=['POST'])
def send_updated_solar_data():
    if request.method=="POST":
        #create simulation object
        sim=Simulation(np.array([session['xp'],session['yp']]),np.array([session['xv'],session['yv']]))
        #get anomaly values from POST request
        anomalies=request.json
        #recalculate position of every planet
        sim.solar_bodies[1].set_heliocentric_coords(anomalies['p1'])
        sim.solar_bodies[2].set_heliocentric_coords(anomalies['p2'])
        sim.solar_bodies[3].set_heliocentric_coords(anomalies['p3'])
        sim.solar_bodies[4].set_heliocentric_coords(anomalies['p4'])
        sim.solar_bodies[5].set_heliocentric_coords(anomalies['p5'])
        sim.solar_bodies[6].set_heliocentric_coords(anomalies['p6'])
        sim.solar_bodies[7].set_heliocentric_coords(anomalies['p7'])
        sim.solar_bodies[8].set_heliocentric_coords(anomalies['p8'])
        #update session with anomaly values
        anom=[anomalies['p1'],anomalies['p2'],anomalies['p3'],anomalies['p4'],anomalies['p5'],anomalies['p6'],anomalies['p7'],anomalies['p8']]
        session['anomalies']=anom
        message=[]
        #put new orbital positions in json and send it
        for i in range(1,9):
            orbital_pos=sim.get_orbital_pos(i)
            message.append({"x":round(orbital_pos[0]+4000000000),"y":round(orbital_pos[1]+4000000000)})
        return jsonify(message)

#update session with values for simulation when we want to start simulation from a new point
@app.route("/postcoords",methods=['POST'])
def change_body_pos():
    if request.method=="POST":
        coords=request.json
        session['xp']=coords['xp']
        session['yp']=coords['yp']
        session['xv']=coords['xv']
        session['yv']=coords['yv']
        return jsonify(success=True)

#remap value form one range to another
def remap_range(old_value,old_min,old_max,new_min,new_max):
    return (((old_value - old_min) * (new_max - new_min)) / (old_max - old_min)) + new_min