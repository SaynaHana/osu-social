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

    xhr.send(params);
}

function saveAccountInfo(username, password) {
    // I know this isn't safe, but I don't think the professor
    // expects us to use tokens
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
}
