function search() {
    let osuUsername = document.getElementById("search-input").value; 
    
    if(osuUsername === "") {
        return alert("Please enter a valid osu! username.");
    }

    // Send request to get osu data
    displayOsuUser(osuUsername)
}

function displayOsuUser(osuUsername) {
    let token = localStorage.getItem("osu-token");
    let accessToken = null;

    if(token != null) {
        accessToken = JSON.parse(token).access_token;
        window.location.href = `../dashboardPage?osuUsername=${osuUsername}&token=${accessToken}`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    checkOsuToken();

    document.getElementById("submit-search").addEventListener("click", search);
});