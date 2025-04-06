function submitSearch() {
    // Send POST request to /playerProfile and try to render the data given  
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/playerProfile");

    xhr.onreadystatechange = () => {
        if(xhr.readyState == 4 && xhr.status == 200) {
        }
    };

    xhr.send();
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-search").addEventListener("click", submitSearch);   
});