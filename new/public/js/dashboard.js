function submitSearch() {
    let osuUsername = document.getElementById("search-input").value;    

    if(osuUsername === "") {
        return alert("Please enter a valid osu! username.");
    }

    window.location.href = `/playerProfile?osuUsername=${osuUsername}`;
}

function submitComment() {
    let comment = document.getElementById("comment-text-area").value;

    if(comment === "") {
        return alert("Please enter a valid comment.");
    }

    let username = document.getElementById("osu-username").textContent;

    if(username === "") {
        return alert("Could not find osu! username.");
    }

    // Send POST request to send comment
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/sendComment");

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        window.location.reload();
    };

    xhr.send(`osuUsername=${username}&comment=${comment}`);
}

function submitLike(id) {

    // Get osu! username

    let username = document.getElementById("osu-username").textContent;

    // Send POST request to send like
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/sendLike");

    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = () => {
        window.location.reload();
    };

    xhr.send(`osuUsername=${username}&scoreId=${id}`);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-search").addEventListener("click", submitSearch);   
    document.getElementById("submit-comment").addEventListener("click", submitComment);

    let likeButtons = document.getElementsByClassName("like-button");

    for(let i = 0; i < likeButtons.length; i++) {
        likeButtons[i].addEventListener("click", function()  {
            let idElement = likeButtons[i].parentElement.getElementsByClassName("score-id")[0];
            let id = idElement.innerText;

            // Parse id
            id = id.split(" ")[1];
            submitLike(id);
        });
    }
});