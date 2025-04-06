var http = require("http");
var express = require("express");
var path = require("path");
var logger = require("morgan");

var app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.locals.pretty = true;

var routes = require("./routes/index");

app.use(logger("dev"));

app.listen(PORT, err => {
    if(err) console.log(err);
    else {
        console.log(`Server listening on port: ${PORT} CTRL-C to stop.`);
    }
})