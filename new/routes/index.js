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

// Shows register page
exports.register = function(request, response) {
    response.render("register", {});
}

// Adds user to database
exports.registerUser = function(request, response, next) {
    let username = request.body.username;
    let password = request.body.password;

    // Try to add to database
    db.run(`INSERT INTO users VALUES ('${username}', '${password}', 'guest', '', '')`, function(err) {
        if(err) {
            // User already exists
            console.log("User with username " + username + " already exists");
            response.writeHead(405, {"Content-Type": "text/html"});
            response.end();
            return;
        }
        
        response.writeHead(200, {"Content-Type": "text/html"})
        response.end();
    });
}

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
    if(token == null || token === "") {
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
    response.render("dashboard", { hasUser: false, account_username: request.username });
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
    let userRequest = https.request(options, function(apiResponse) {
        let userData = "";

        apiResponse.on("data", function(chunk) {
            userData += chunk;
        });

        apiResponse.on("end", function() {
            if(apiResponse.statusCode == 200) {
                let data = JSON.parse(userData);
                //console.log(data.username);

                // Get comments, total likes from SQL database
                db.all(`SELECT * FROM osu_users WHERE userid='${data.username}'`, function(err, users) {
                    // If user is not in database, then add them
                    if(users.length == 0) {
                        db.run(`INSERT INTO osu_users VALUES ('${data.username}', '[]', 0, 0)`, [], function(err1) {
                            if(err1) {
                                console.log(err1);
                                console.log("Unable to add osu! user to database.");
                                response.writeHead(400, {"Content-Type": "text/html"});
                                response.end();
                            }
                        });

                        data.comments = [];
                        data.likes = 0;
                    }
                    else {
                        data.comments = JSON.parse(users[0].comments);
                        data.likes = users[0].likes;
                    }

                    getTopScores(request, response, data);
                });

            }
            else {
                console.log("Could not get osu! user data.");
                response.writeHead(400, {"Content-Type": "text/html"});
                response.end();
            }
        });
    });

    userRequest.end();
}

getTopScores = function(request, response, data) {
    // Send GET request to osu! API to get scores
    let options = {
        host: OSU_HOST,
        path: "/api/v2/users/" + data.id + "/scores/best?mode=osu&limit=5",
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${request.osuToken}`
        }
    };

    let scoresRequest = https.request(options, function(apiResponse) {
        let scoresData = "";

        apiResponse.on("data", function(chunk) {
            scoresData += chunk;
        });

        apiResponse.on("end", function() {
            if(apiResponse.statusCode == 200) {
                data.topScores = JSON.parse(scoresData);

                // For each of the scores, check if it is in the database
                // If it is, then get the likes
                // Else, add it to the database
                for(let i = 0; i < data.topScores.length; i++) {
                    db.all(`SELECT * FROM scores WHERE id='${data.topScores[i].id}'`, function(err, scores) {
                        if(err) {
                            console.log(err);
                            response.writeHead(400, {"Content-Type": "text/html"});
                            response.end();
                        }

                        data.topScores[i].liked = false;

                        if(scores.length != 0) {
                            let score = scores[0]; 
                            
                            data.topScores[i].likes = score.likes;
                            data.topScores[i].usersLiked = JSON.parse(score.users_liked);

                            // Check if liked
                            let usersLiked = data.topScores[i].usersLiked;

                            if(usersLiked.includes(request.username)) {
                                data.topScores[i].liked = true;
                            }
                        }
                        else {
                            db.run(`INSERT INTO scores VALUES('${data.topScores[i].id}', '0', '[]')`, function(err1) {
                                if(err1) {
                                    console.log(err1);
                                    response.writeHead(400, {"Content-Type": "text/html"});
                                    response.end();
                                }
                            });
                        }

                        if(i == data.topScores.length - 1) {
                            displayPlayerProfile(request, response, data);
                        }
                    });
                }
            }
            else {
                console.log("Could not get osu! user's top plays.");
                response.writeHead(400, {"Content-Type": "text/html"});
                response.end();
            }
        });
    });

    scoresRequest.end();
}

displayPlayerProfile = function(request, response, data) {
    // Convert accuracy to percentage
    for(let i = 0; i < data.topScores.length; i++) {
        let accuracy = data.topScores[i].accuracy * 100;
        data.topScores[i].accuracy = Math.round(accuracy * 100) / 100;

        // If user liked the score, then change liked to "Unlike"
        data.topScores[i].likedText = "Like";
    }

    response.render("dashboard", {
        hasUser: true,
        account_username: request.username,
        username: data.username,
        global_rank: data.statistics.global_rank,
        country_rank: data.statistics.country_rank,
        pp: data.statistics.pp,
        id: data.id,
        likes: data.likes,
        profile_pic_src: data.avatar_url,
        top_scores: data.topScores,
        comments: data.comments
    });
}

exports.sendComment = function(request, response) {
    let osuUsername = request.body.osuUsername;

    // Find username in DB 
    db.all(`SELECT * FROM osu_users WHERE userid='${osuUsername}'`, function(err, users) {
        if(err) {
            console.log(err);
            response.writeHead(400, {"Content-Type": "text/html"});
            response.end();
        }        

        if(users.length == 0) {
            console.log("Could not find osu! user with username.");
            response.writeHead(404, {"Content-Type": "text/html"});
            response.end();
        }

        let comments = JSON.parse(users[0].comments);

        let comment = {
            sender: request.username,
            comment: request.body.comment
        }

        comments.push(comment);

        db.run(`UPDATE osu_users SET comments='${JSON.stringify(comments)}' WHERE userid='${osuUsername}'`, function(err) {
            if(err) {
                console.log(err);
                response.writeHead(400, {"Content-Type": "text/html"});
                response.end();
            }

            console.log("Comment sent successfully.");
            response.writeHead(200, {"Content-Type": "text/html"});
            response.end();
        });
    });
}

exports.sendLike = function(request, response) {
    // Get osu! username and score id
    let osuUsername = request.body.osuUsername;
    let scoreId = request.body.scoreId;

    if(osuUsername == null || scoreId == null) {
        console.log("Could not find osu! username or score ID.");
        response.writeHead(400, {"Content-Type": "text/html"});
        response.end();
    }

    // Find score and increment likes
    db.all(`SELECT * FROM scores WHERE id='${scoreId}'`, function(err, scores) {
        if(scores.length == 0) {
            console.log("Could not find score.");
            response.writeHead(404, {"Content-Type": "text/html"});
            response.end();
        }

        if(err) {
            console.log(err);
            response.writeHead(400, {"Content-Type": "text/html"});
            response.end();
        }

        // Increment likes
        let score = scores[0];
        let usersLiked = JSON.parse(score.users_liked);

        if(usersLiked.includes(request.username)) {
            response.writeHead(401, {"Content-Type": "text/html"});
            response.end();
        }
        else {
            usersLiked.push(request.username);

            db.run(`UPDATE scores SET likes='${score.likes + 1}', users_liked='${JSON.stringify(usersLiked)}' WHERE id=${scoreId}`, function(err1) {
                if(err1) {
                    console.log(err1);
                    response.writeHead(400, {"Content-Type": "text/html"});
                    response.end();
                }

                // Update osu! user's total likes
                db.all(`SELECT * FROM osu_users WHERE userid='${osuUsername}'`, function(err2, users) {
                    if(users.length == 0) {
                        console.log("Could not update osu! user.");
                        response.writeHead(400, {"Content-Type": "text/html"});
                        response.end();
                    }

                    if(err2) {
                        console.log(err2);
                        response.writeHead(400, {"Content-Type": "text/html"});
                        response.end();
                    }

                    let user = users[0];
                    db.run(`UPDATE osu_users SET likes='${user.likes + 1}' WHERE userid='${osuUsername}'`, function(err3) {
                        if(err3) {
                            console.log(err3);
                            response.writeHead(400, {"Content-Type": "text/html"});
                            response.end();
                        }

                        console.log("Successfully added like.");
                        response.writeHead(200, {"Content-Type": "text/html"});
                        response.end();
                    });
                });
            });
        }

    });
}