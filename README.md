# SolarSystem-Trajectory
Small Python web app made with Flask (and p5.js, Bootstrap).This app displays a solar system map (consisting of Sun and 8 planets) with real proportions. User can choose position of each planet in it's orbit and input initial position and velocity of a simulated object, time of simulation and then calculate trajectory of that object in the solar system.

You can run this app localy in debug mode like any Flask app. Go to app folder, set environmental variable FLASK_APP="main" and then running:
```
flask run
```
after that go to 127.0.0.1:5000 to see the app.

You can easily create a Docker image which deploys this app with uWSGI and Nginx. In terminal go to the main folder of this repo (containing Dockerfile) and run:
```
docker build -t imagename .
```
Run the container with:
```
docker run -d --name containername -p 80:80 imagename
```
Then you can visit the app on 127.0.0.1:80
