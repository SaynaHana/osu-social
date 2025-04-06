function submitSearch() {
    let osuUsername = document.getElementById("search-input").value;    

    if(osuUsername === "") {
        return alert("Please enter a valid osu! username.");
    }

    window.location.href = `/playerProfile?osuUsername=${osuUsername}`;
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-search").addEventListener("click", submitSearch);   
});