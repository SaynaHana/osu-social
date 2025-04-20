function register() {
    // Get username and password and check if valid
    let username = document.getElementById("username-input").value;
    let password = document.getElementById("password-input").value;

    let valid = true;

    if(username === "" || password === "") {
        valid = false;
    }
    else if(username.includes(":") || password.includes(":")) {
        valid = false;
    }

    if(!valid) {
        return alert("Please enter a valid username and password.");
    }

    // Send POST request to /registerUser
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/registerUser");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 405) {
            return alert("Username already exists. Please try a different username.");
        }   
        else if(xhr.readyState == 4 && xhr.status == 200) {
            alert("Account created successfully.");
            window.location.href = "/dashboard";
        }
    };

    xhr.send(`username=${username}&password=${password}`);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-register").addEventListener("click", register);
});