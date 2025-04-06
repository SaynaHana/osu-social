var url = require("url");
var moment = require("moment");
var sqlite3 = require("sqlite3").verbose();
var https = require("https");
var db = new sqlite3.Database("data/db_projectData");

// osu! api credentials
const OSU_HOST = "osu.ppy.sh";
const OSU_CLIENT_ID = "39625";
const OSU_CLIENT_SECRET = "qZXZ77yZxs6U7tJaqT91Xv8yW0Hywr3fUHz2eYtP";

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT, role TEXT, osu_token TEXT)");
});

exports.authenticate = function(request, response, next) {
    var auth = request.headers.authorization;    

    // Auth is base64 representation of (username:password)
    if(!auth) {
        response.setHeader("WWW-Authenticate", "Basic realm='need to login'");
        response.writeHead(401, {"Content-Type": "text/html"});
        console.log("No authorization found, send 401.");
        response.end();
    }
    else {
        console.log("Authorization Header: " + auth);
        var tmp = auth.split(" ");

        // Decode authorization
        var buf = Buffer.from(tmp[1], "base64");

        var plain_auth = buf.toString();
        console.log("Decoded Authorization", plain_auth);

        var credentials = plain_auth.split(":");
        var username = credentials[0];
        var password = credentials[1];
        console.log("Username: " + username);
        console.log("Password: " + password);
        
        var authorized = false;

        // Check if user exists in database
        db.all("SELECT userid, password, osu_token, token_expired_date FROM users", function(err, rows) {
            for(let i = 0; i < rows.length; i++) {
                if(rows[i].userid === username && rows[i].password === password) {
                    authorized = true;
                    request.username = username;
                    request.password = password;
                    request.osuToken = rows[i].osu_token;
                    request.expiredDate = rows[i].token_expired_date;
                }
            }

            if(authorized == false) {
                response.setHeader("WWW-Authenticate", "Basic realm='need to login'");
                response.writeHead(401, {"Content-Type": "text/html"});
                console.log("No authorization found, send 401.");
                response.end();
            }
            else {
                next();
            }
        });
    }
}

exports.checkForToken = function(request, response, next) {
    // Checks if the user has a valid token
    let token = request.osuToken;
    let validToken = true;

    // If token does not exist, get a new one
    if(token == null) {
        validToken = false;
    }
    // If token is expired, get a new one
    else {
        if(request.expiredDate == null) {
            validToken = false;
        }
        else {
            // Check if token is expired by comparing times
            let expiredDate = moment(request.expiredDate).toDate();
            let now = moment(Date.now()).toDate();

            if(expiredDate < now) {
                validToken = false;
            }
        }
    }

    if(!validToken) {
        console.log("Token is invalid. Getting new one...");

        // Get new token
        let params = `client_id=${OSU_CLIENT_ID}&client_secret=${OSU_CLIENT_SECRET}&grant_type=client_credentials&scope=public`;

        // Headers in request from: https://stackoverflow.com/questions/6158933/how-is-an-http-post-request-made-in-node-js/6158966#6158966    
        let options = {
            host: OSU_HOST,
            path: "/oauth/token",
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        let token_request = https.request(options, function(apiResponse) {
            let tokenData = "";

            apiResponse.on("data", function(chunk) {
                tokenData += chunk;
            });

            apiResponse.on("end", function() {
                if(apiResponse.statusCode == 200) {
                    let data = JSON.parse(tokenData);
                    let newToken = data.access_token;
                    
                    // Get expired date
                    // From: https://stackoverflow.com/questions/1197928/how-to-add-30-minutes-to-a-javascript-date-object
                    let date = Date.now();
                    date = moment(date).add(0, "m").toDate();
                    let expiredDate = moment(date).add(720, "m").toDate();

                    // Add to sql database
                    db.run(`UPDATE users SET osu_token='${newToken}', token_expired_date='${expiredDate}' WHERE userid='${request.username}' AND password='${request.password}'`, [], function(err) {
                        if(err) {
                            console.log(err);
                            console.log("Could not update database.");
                            response.writeHead(400, {"Content-Type": "text-html"});
                            response.end();
                        }
                        else {
                            request.osuToken = newToken;
                            next();
                        }

                    });
                }
                else {
                    console.log("Could not get osu! token.");
                    response.writeHead(400, {"Content-Type": "text-html"});
                    response.end();
                }
            });
        });

        token_request.write(params);
        token_request.end();
    }
    else {
        console.log("Token is not expired.");
        next();
    }
}

exports.dashboard = function(request, response) {
    response.render("dashboard", { hasUser: false });
}

exports.playerProfile = function(request, response) {
    let token = request.osuToken;

    if(token == null) {
        console.log("Invalid token.");
        response.writeHead(401, {"Content-Type": "text-html"});
        response.end();
    }

    let osuUsername = request.query.osuUsername;

    if(osuUsername == null) {
        console.log("Invalid osu! username.");
        response.writeHead(400, {"Content-Type": "text-html"});
        response.end();
    }

    // Get osu! user data
    let options = {
        host: OSU_HOST,
        path: "/api/v2/users/" + osuUsername + "/osu?key=username",
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };

    // Read user data
    let user_request = https.request(options, function(apiResponse) {
        let userData = "";

        apiResponse.on("data", function(chunk) {
            userData += chunk;
        });

        apiResponse.on("end", function() {
            if(apiResponse.statusCode == 200) {
                let data = JSON.parse(userData);
                console.log(data);

                response.render("dashboard", {
                    hasUser: true,
                    username: data.username,
                    global_rank: data.statistics.global_rank,
                    country_rank: data.statistics.country_rank,
                    pp: data.statistics.pp,
                    profile_pic_src: data.avatar_url
                });
            }
            else {
                console.log("Could not get osu! user data.");
                response.writeHead(400, {"Content-Type": "text-html"});
                response.end();
            }
        });
    });

    user_request.end();
}

exports.displayPlayerProfile = function(request, response) {

}