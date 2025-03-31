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
        xhr.open("POST", "/login");
    }

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
            window.location.href = "../dashboardPage";
        }
        else if(xhr.status == 409) {
            return alert("User already exists. Please try a different username.");
        }
    }

    xhr.send(params);
}

function redirectToDashboard() {
    let xhr = new XMLHttpRequest(); 

    xhr.open("GET", "/dashboardPage");

    xhr.onreadystatechange = () => {

    }

    xhr.send();
}
