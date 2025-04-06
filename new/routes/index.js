var url = require("url");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("data/db_projectData");

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS users (userid TEXT PRIMARY KEY, password TEXT, role TEXT)");
    db.run("INSERT OR REPLACE INTO users VALUES ('admin', 'secret', 'admin')");
});

exports.authenticate = function(request, response, next) {
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
        db.all("SELECT userid, password FROM users", function(err, rows) {
            for(let i = 0; i < rows.length; i++) {
                if(rows[i].userid === username && rows[i].password === password) authorized = true;
            }

            if(authorized == false) {
                response.setHeader("WWW-Authenticate", "Basic realm='need to login'");
                response.writeHead(401, {"Content-Type": "text/html"});
                console.log("NO authorization found, send 401.");
                response.end();
            }
            else {
                next();
            }
        });
    }
}