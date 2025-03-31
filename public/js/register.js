function register() {
    let username = document.getElementById("username-input").value;
    let password = document.getElementById("password-input").value;

    if(username == "" || password == "") {
        return alert("Please enter a valid username and password.");
    }


    // Sending form url encoded data from: https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
    let xhr = new XMLHttpRequest();
    let params = `username=${username}&password=${password}`;

    xhr.open("POST", "/register");

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {

        }
    }

    xhr.send(params);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-register").addEventListener("click", register);
});
