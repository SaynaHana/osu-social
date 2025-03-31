var url = require("url");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("data/db_projectData");

exports.loginPage = function(request, response) {
    // login.hbs
    response.render("login", {});
}

exports.registerPage = function(request, response) {
    // register.hbs
    response.render("register", {});
}

exports.register = function(request, response) {
    let username = request.body.username;
    let password = request.body.password;

    let authorized = false;

    // See if user with username exists already
    db.all(`SELECT userid FROM users WHERE userid='${username}'`, function(err, users) {
        // Check if user exists
        if(users.length != 0) {
            response.writeHead(409, {"Content-Type": "text/html"});
            console.log("User already exists, send 409.");
            response.end();
        }
        else {
            authorized = true;

            db.run(`INSERT INTO users VALUES ('${username}', '${password}', 'guest')`);
            response.writeHead(200, {"Content-Type": "text/html"});
            console.log("Successfully registered, send 200.");
            response.end();
        }
    });
}

exports.authorization = function(request, response) {
    let username = request.body.username;
    let password = request.body.password;

    let authorized = false;

    db.all(`SELECT userid, password FROM users WHERE userid='${username}' AND password='${password}'`, function(err, users) {
        for(let i = 0; i < users.length; i++) {
            if(users[i].userid === username && users[i].password === password) {
                authorized = true;
            }
        }

        if(authorized == false) {
            response.writeHead(401, {"Content-Type": "text/html"});
            console.log("Unauthorized, send 401.");
            response.end();
        }
        else {
            response.writeHead(200, {"Content-Type": "text/html"});
            console.log("Authorized, send 200.");
            response.end();
        }
    });
}

exports.dashboardPage = function(request, response) {
    let osuUsername = request.body.osuUsername;

    response.render("dashboard", { 
        userGiven: osuUsername != null
    }); 
}
