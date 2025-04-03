function register() {
    let username = document.getElementById("username");
    let password = document.getElementById("password");

    if(username === "" || password === "") {
        return alert("Please enter a valid username and password.");
    }

    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
            let response = JSON.parse(xhr.responseText)
            console.log(response)
        }
    }

    // Source for POST request: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send
    xhr.open("POST", "/register");
    xhr.setRequestHeader("Content-Type", "application/json");

    const data = JSON.stringify({ username: username, password: password});
    xhr.send(data);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-register").addEventListener("click", register);
});