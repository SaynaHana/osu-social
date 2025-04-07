var http = require("http");
var express = require("express");
var path = require("path");
var logger = require("morgan");

var app = express();
const PORT = process.env.PORT || 3000;

// Make it so we can access public folder
app.use(express.static(path.join(__dirname, "public")));

// Express url encoded from: https://www.geeksforgeeks.org/express-js-express-urlencoded-function/
app.use(express.urlencoded({ extended: true }));

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.locals.pretty = true;

var routes = require("./routes/index");

app.get(["/", "/register"], routes.register);
app.post("/registerUser", routes.registerUser);
app.use(routes.authenticate);
app.use(logger("dev"));

app.get("/dashboard", routes.dashboard);
app.get("/playerProfile", routes.checkForToken, routes.playerProfile);
app.post("/sendComment", routes.sendComment);
app.post("/sendLike", routes.sendLike);

app.listen(PORT, err => {
    if(err) console.log(err);
    else {
        console.log(`Server listening on port: ${PORT} CTRL-C to stop.`);
    }
})