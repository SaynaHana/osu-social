function login() {
    let username = document.getElementById("username-input").value;
    let password = document.getElementById("password-input").value;

    // authenticate(username, password, "login");

    // Send get request for dashboard
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/dashboardPage");
    xhr.setRequestHeader("Authorization", `Basic ${username}:${password}`);

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
            window.location.href = "/dashboardPage";
        }
    };

    xhr.send();
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-login").addEventListener("click", login);
});
