var http = require("http");
var express = require("express");
var path = require("path");
var logger = require("morgan");

var app = express();

const PORT = process.env.PORT || 3000

// View engine setup
app.use(express.static(path.join(__dirname, "public")));

// Express url encoded from: https://www.geeksforgeeks.org/express-js-express-urlencoded-function/
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.locals.pretty = true;

// Read route modules
var routes = require("./routes/index");

function methodLogger(request, response, next){
    console.log("METHOD LOGGER");
    console.log("================================");
    console.log("METHOD: " + request.method);
    console.log("URL:" + request.url);
    next(); //call next middleware registered
}
function headerLogger(request, response, next){
    console.log("HEADER LOGGER:")
    console.log("Headers:")
    for(k in request.headers) console.log(k);
    next(); //call next middleware registered
}

app.use(logger("dev"));

// Routes
app.get("/registerPage", routes.registerPage);
app.post("/register", routes.register);
app.post("/login", routes.login);
app.get(["/", "/dashboardPage"], routes.authorization, routes.dashboardPage);
app.post("/authorization", routes.authorization);
app.get("/osuToken", routes.authorization, routes.osuToken);
app.get("/osuTokenExpired", routes.authorization, routes.osuTokenExpired);
app.post("/osuUser", routes.authorization, routes.osuUser);

app.listen(PORT, err => {
    if(err) console.log(err)
    else {
        console.log(`Server listening on port: ${PORT} CNTRL:-C to stop`);
    }
})
