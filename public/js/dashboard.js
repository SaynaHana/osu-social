function search() {
    let osuUsername = document.getElementById("search-input").value; 
    
    if(osuUsername === "") {
        return alert("Please enter a valid osu! username.");
    }

    // Send request to get osu data
    getOsuUser(osuUsername, displayOsuUser);
}

function displayOsuUser(response) {
    console.log(response);
}

function getOsuUser(osuUsername, callback) {
    let xhr = new XMLHttpRequest(); 
    let params = `osuUsername=${osuUsername}&token=${localStorage.getItem("osu-token")}`;
    xhr.open("POST", `/osuUser?osuUsername=${osuUsername}`);

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr.responseText);
        }
    }

    xhr.send(params);
}

document.addEventListener("DOMContentLoaded", function() {
    checkOsuToken();

    document.getElementById("submit-search").addEventListener("click", search);
});