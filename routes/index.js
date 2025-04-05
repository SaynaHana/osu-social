var url = require("url");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("data/db_projectData");
var https = require("https");
var moment = require("moment");

// the osu! api credentials
const CLIENT_ID = "39625";
const CLIENT_SECRET = "qZXZ77yZxs6U7tJaqT91Xv8yW0Hywr3fUHz2eYtP";


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
            response.setHeader("WWW-Authenticate", "Basic realm='need to login'");
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
    let osuUsername = request.query.osuUsername;
    let token = request.query.token;
    
    // If no osu! username given, just render
    if(osuUsername == null && token == null) {
        response.render("dashboard", { 
            hasUser: false
        }); 

        return;
    }

    // Otherwise, get osu! user data and then display

    // Get osu! user data
    let options = {
        host: "osu.ppy.sh",
        path: "/api/v2/users/" + osuUsername + "/osu?key=username",
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };

    let osu_request = https.request(options, function(apiResponse) {
        let userData = "";

        apiResponse.on("data", function(chunk) {
            userData += chunk;
        });
        apiResponse.on("end", function() {
            let data = JSON.parse(userData);
            console.log(data);

            if(apiResponse.statusCode !== 200) {
                response.render("dashboard", { 
                    hasUser: false
                }); 

                return;
            }

            // Get osu! scores

            options = {
                host: "osu.ppy.sh",
                path: "/api/v2/users/" + data.id + "/scores/best?mode=osu&limit=100",
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }

            // Make request for top scores
            let scores_request = https.request(options, function(scoreResponse) {
                let scoreData = "";

                scoreResponse.on("data", function(chunk) {
                    scoreData += chunk;
                });

                scoreResponse.on("end", function() {
                    let topScores = JSON.parse(scoreData);

                    // Change accuracy to percentage
                    for(let i = 0; i < topScores.length; i++) {
                        topScores[i].accuracy *= 100;
                        topScores[i].accuracy = Math.round((topScores[i].accuracy * 100)) / 100;
                    }

                    console.log(topScores);

                    response.render("dashboard", {
                        hasUser: true,
                        username: data.username,
                        global_rank: data.statistics.global_rank,
                        country_rank: data.statistics.country_rank,
                        pp: data.statistics.pp,
                        profile_pic_src: data.avatar_url,
                        top_scores: topScores
                    });
                });
            });
            scores_request.end();
        });
    });

    osu_request.end();
}

exports.osuToken = function(request, response) {
    // Tries to get an osu token
    let params = `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials&scope=public`;

    // Create HTTPS request
    // Headers in request from: https://stackoverflow.com/questions/6158933/how-is-an-http-post-request-made-in-node-js/6158966#6158966
    let options = {
        host: "osu.ppy.sh",
        path: "/oauth/token",
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    let osu_request = https.request(options, function(apiResponse) {
        let tokenData = "";

        apiResponse.on("data", function(chunk) {
            tokenData += chunk
        });
        apiResponse.on("end", function() {
            let data = JSON.parse(tokenData);

            // Add date and time so that we can see when it expires
            // From: https://stackoverflow.com/questions/1197928/how-to-add-30-minutes-to-a-javascript-date-object
            let date = Date.now();
            date = moment(date).add(0, "m").toDate();
            let expiredDate = moment(date).add(720, "m").toDate();

            data.expiredDate = expiredDate;

            response.contentType("application/json").json(data);
        });
    });

    // Sending post data from: https://stackoverflow.com/questions/6158933/how-is-an-http-post-request-made-in-node-js/6158966#6158966
    osu_request.write(params);
    osu_request.end();
}

// Check if osu token is expired
exports.osuTokenExpired = function(request, response) {
    // Get expired date
    let expiredDate = moment(request.query.expiredDate).toDate();

    let now = moment(Date.now()).toDate();
    let expired = false;

    if(expiredDate < now) {
        expired = true;
    }

    response.contentType("text/json").json({ expired: expired });
}

exports.osuUser = function(request, response) {
}