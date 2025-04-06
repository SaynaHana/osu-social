function register() {
    let username = document.getElementById("username-input").value;
    let password = document.getElementById("password-input").value;

    authenticate(username, password, "register");
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-register").addEventListener("click", register);
});
