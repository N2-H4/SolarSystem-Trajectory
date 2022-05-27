from math import sin,cos,radians,sqrt
import numpy as np

#stores attributes of planet/sun, can calculate heliocentric coordinates 
class CelestialBody:
    def __init__(self,name,mass,radius,semi_major,eccentricity,lof_ascending,lof_periphelion,orbit_inclination) -> None:
        self.name=name
        self.mass=mass
        self.radius=radius
        self.semi_major=semi_major
        self.eccentricity=eccentricity
        self.lof_ascending=lof_ascending
        self.lof_periphelion=lof_periphelion
        self.orbit_inclination=orbit_inclination
        self.coords=(0,0)

    #formula for heliocentric coordinates from true anomaly (J2000 elements)
    def set_heliocentric_coords(self,true_anomaly):
        true_anomaly=radians(true_anomaly)
        r=self.semi_major*(1-self.eccentricity**2)/(1+self.eccentricity*cos(true_anomaly))
        x=r*(cos(self.lof_ascending)*cos(true_anomaly+self.lof_periphelion-self.lof_ascending)
        -sin(self.lof_ascending)*sin(true_anomaly+self.lof_periphelion-self.lof_ascending)*cos(self.orbit_inclination))
        y=r*(sin(self.lof_ascending)*cos(true_anomaly+self.lof_periphelion-self.lof_ascending)
        +cos(self.lof_ascending)*sin(true_anomaly+self.lof_periphelion-self.lof_ascending)*cos(self.orbit_inclination))
        self.coords=(x,y)

    def get_heliocentric_coords(self):
        if self.name=="Sun":
            return (0,0)
        return self.coords


#used to simulate movement of object in solar system
class Simulation:
    def __init__(self,pos,vel) -> None:
        #sim_body=body which movement is simulated
        self.sim_body_pos=pos
        self.sim_body_vel=vel
        #gravitational constant G
        self.grav_const=6.674e-20
        #Astronomical unit in kilometers
        self.AU=149597871
        #multipler for adaptive step size formula
        self.timestep=25

        self.solar_bodies=[]
        self.solar_bodies.append(CelestialBody("Sun",1989e27,696340,0,0,0,0,0))
        self.solar_bodies.append(CelestialBody("Mercury",33010e19,2440.5,0.38709893,0.2056,radians(48.33167),radians(77.45645),radians(7.00487)))
        self.solar_bodies.append(CelestialBody("Venus",48673e20,6051.8,0.72333199,0.0068,radians(76.68069),radians(131.53298),radians(3.39471)))
        self.solar_bodies.append(CelestialBody("Earth",59722e20,6378.1,1.00000011,0.0167086,radians(-11.26064),radians(102.94719),radians(0.00005)))
        self.solar_bodies.append(CelestialBody("Mars",64169e19,3396.2,1.52366231,0.0934231,radians(49.57854),radians(336.04084),radians(1.85061)))
        self.solar_bodies.append(CelestialBody("Jupiter",189813e22,71492,5.20336301,0.04839266,radians(100.55615),radians(14.75385),radians(1.30530)))
        self.solar_bodies.append(CelestialBody("Saturn",56832e22,60268,9.53707032,0.05415060,radians(113.71504),radians(92.43194),radians(2.48446)))
        self.solar_bodies.append(CelestialBody("Uranus",86811e21,25559,19.19126393,0.04716771,radians(74.22988),radians(170.96424),radians(0.76986)))
        self.solar_bodies.append(CelestialBody("Neptune",102409e21,24764,30.06896348,0.00858587,radians(131.72169),radians(44.97135),radians(1.76917)))

        for body in self.solar_bodies:
            body.set_heliocentric_coords(0)
        

    def set_body(self,pos,vel):
        self.sim_body_pos=pos
        self.sim_body_vel=vel

    #multiply heliocentric coordinates by AU to get positon in kilometers
    def get_orbital_pos(self,index):
        x,y=self.solar_bodies[index].get_heliocentric_coords()
        return np.array([x*self.AU,y*self.AU])

    #check if body collided with any planet/sun
    def collision_detection(self):
        for i in range(9):
            if np.linalg.norm(self.sim_body_pos-self.get_orbital_pos(i))<self.solar_bodies[i].radius:
                return True
        return False
    
    #sum forces acting on body and return acceleration vector of body (Newton's law of universal gravitation)
    def get_acceleration(self):
        final_vector=np.array([0,0])
        for i in range(9):
            mass=self.solar_bodies[i].mass
            position=self.get_orbital_pos(i)
            direction_vector=position-self.sim_body_pos
            acc_value=(self.grav_const*mass)/(np.linalg.norm(direction_vector)**2)
            final_vector=final_vector+(acc_value*(direction_vector/np.linalg.norm(direction_vector)))
        return final_vector

    #like function above but retruns accelartaion of any point in space
    def get_acceleration_at(self,p):
        final_vector=np.array([0,0])
        for i in range(9):
            mass=self.solar_bodies[i].mass
            position=self.get_orbital_pos(i)
            direction_vector=position-p
            acc_value=(self.grav_const*mass)/(np.linalg.norm(direction_vector)**2)
            final_vector=final_vector+(acc_value*(direction_vector/np.linalg.norm(direction_vector)))
        return final_vector

    #euler ode integration method
    def integrate_euler(self):
        acc=self.get_acceleration()
        #calculate adaptive timestep from acceleration vector
        h=round(sqrt(self.timestep/(np.linalg.norm(acc))))
        new_vel=self.sim_body_vel+(h*acc)
        new_pos=self.sim_body_pos+(h*new_vel)
        return (new_vel,h)

    #heun's integration method with adaptive time step 
    def integrate_heun(self):
        acc=self.get_acceleration()
        euler_vel,h=self.integrate_euler()
        self.sim_body_vel=self.sim_body_vel+(h*acc)
        self.sim_body_pos=self.sim_body_pos+((h/2)*(self.sim_body_vel+euler_vel))
        #return how much we advanced the simulation
        return h

    #rk4 integration method, not used, breaks unless very small timesteps (slow)
    def integrate_rk4(self):
        k1v=self.get_acceleration()
        k1r=self.sim_body_vel
        k2v=self.get_acceleration_at(self.sim_body_pos+(k1r*(self.timestep/2)))
        k2r=self.sim_body_vel*k1v*(self.timestep/2)
        k3v=self.get_acceleration_at(self.sim_body_pos+(k2r*(self.timestep/2)))
        k3r=self.sim_body_vel*k2v*(self.timestep/2)
        k4v=self.get_acceleration_at(self.sim_body_pos+(k3r*self.timestep))
        k4r=self.sim_body_vel*k3v*self.timestep

        self.sim_body_vel=self.sim_body_vel+(self.timestep/6)*(k1v+2*k2v+2*k3v+k4v)
        self.sim_body_pos=self.sim_body_pos+(self.timestep/6)*(k1r+2*k2r+2*k3r+k4r)
        
    #simulate movement of body for requested amount of seconds and return list of points on trajectory
    def simulate_for(self,seconds):
        positions_in_time=[]
        positions_in_time.append(self.sim_body_pos)
        simulated_for=0
        while True:
            if simulated_for>=seconds:
                break
            if self.collision_detection():
                break
            simulated_for+=self.integrate_heun()
            positions_in_time.append(self.sim_body_pos)
        return np.array(positions_in_time)

