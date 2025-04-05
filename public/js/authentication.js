function authenticate(username, password, mode) {
    if(username == "" || password == "") {
        return alert("Please enter a valid username and password.");
    }


    // Sending form url encoded data from: https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
    let xhr = new XMLHttpRequest();
    let params = `username=${username}&password=${password}`;

    if(mode === "register") {
        xhr.open("POST", "/register");
    }
    else {
        xhr.open("POST", "/authorization");
    }

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
            saveAccountInfo(username, password);
            window.location.href = "../dashboardPage";
        }
        else if(xhr.status == 409) {
            return alert("User already exists. Please try a different username.");
        }
        else if(xhr.status == 401) {
            return alert("User does not exist, or username or password is incorrect.");
        }
    }

    // Try to get osu token if needed
    checkOsuToken();

    xhr.send(params);
}

function checkOsuToken() {
    // Gets a public osu token when user's token is expired
    // Check if current token is expired
    let tokenData = JSON.parse(localStorage.getItem("osu-token"));

    // Check if token exists
    if(tokenData != null) {
        // Check if token is expired
        let xhr = new XMLHttpRequest()

        xhr.onreadystatechange = () => {
            if(xhr.readyState == 4 && xhr.status == 200) {
                let data = JSON.parse(xhr.responseText); 

                if(data.expired === true) {
                    getOsuToken();
                }
                else {
                    console.log("Token is not expired.");
                }
            }
        }

        xhr.open("GET", `/osuTokenExpired?expiredDate=${tokenData.expiredDate}`);
        xhr.send();
    }
    else {
        getOsuToken();
    }
}

function getOsuToken() {
    console.log("Token is expired. Getting new one..."); 
    
    // Get a token
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
            let token = JSON.parse(xhr.responseText);
            localStorage.setItem("osu-token", JSON.stringify(token));
        }
    }

    xhr.open("GET", `/osuToken`);
    xhr.send();
}

function saveAccountInfo(username, password) {
    // I know this isn't safe, but I don't think the professor
    // expects us to use tokens
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
}
