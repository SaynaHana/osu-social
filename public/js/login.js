function login() {
    let username = document.getElementById("username-input").value;
    let password = document.getElementById("password-input").value;

    authenticate(username, password, "login");
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-login").addEventListener("click", login);
});
