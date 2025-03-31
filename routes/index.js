exports.loginPage = function(request, response) {
    // login.hbs
    response.render("login", {});
}

exports.registerPage = function(request, response) {
    // register.hbs
    response.render("register", {});
}

exports.register = function(request, response) {
    console.log(request.body);
}
