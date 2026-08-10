document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded");

    setUploadButton();
    setCreateFolderButton();
    setSearchButton();
    loadView();

    window.addEventListener("popstate",loadView);
})


//load view when finished loading folder or searching = fetch for search/browse and render
async function loadView() {
    console.log("called loadView()");

    const params = new URLSearchParams(location.search);
    const path = params.get("path") || "";
    const searchTerm = params.get("search") || "";
    clearField();

    try {
        if (searchTerm.trim() !== "") {
            const result = await searchFolder(path, searchTerm);
            document.getElementById("summary").style.visibility = "hidden";
            renderFolder(result);
        } else {
            const result = await browseFolder(path);
            renderFolder(result.items);
            document.getElementById("summary").style.visibility = "visible";
            renderSummary(result);
        }
    } catch (error) {
        showError(error.message);
    }
}

//render for search
//render for normal view
async function browseFolder(path) {
    console.log("called browseFolder()");

    const url = `/api/files/browse?path=${encodeURIComponent(path)}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to load folder.");
    }

    return await response.json();
}

function renderFolder(data) {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";
    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "fileRow";

        const icon = document.createElement("span");
        icon.textContent = (item.type === "folder") ? "📁" : "📄";
        const name = document.createElement("span");
        name.textContent = item.name;
        name.className = "file-name";
        div.appendChild(icon);
        div.appendChild(name);


        div.style.cursor = "pointer";
        
        if (item.type === "folder") {
            div.addEventListener("click", () => {
                openFolder(item.revPath);
            });
        }

        if (item.type === "file") {
            div.addEventListener("click", () => {
                downloadFile(item.revPath);
            });
        }

        fileList.appendChild(div);
    });
}

function openFolder(path) {
    history.pushState({}, "",`?path=${encodeURIComponent(path)}`);
    loadView();
}

//upload
async function uploadFile(file, path) {
    const form = new FormData();
    form.append("file", file);

    const url = `/api/files/upload?path=${encodeURIComponent(path)}`;
    const response = await fetch(url, {
        method: "POST",
        body: form
    });

    if(!response.ok) {
        throw new Error("Upload failed.")
    }
    
    await loadView();
}

function setUploadButton() {
    const uploadButton = document.getElementById("uploadButton");
    const inputFile = document.getElementById("uploadFile");

    uploadButton.addEventListener("click", async () => {
        if (!inputFile.files.length) {
            return;
        }

        try {
            const file = inputFile.files[0];
            await uploadFile(file, (new URLSearchParams(location.search)).get("path") || "");
        } catch (error) {
            showError(error.message);
        }
    });
}

//download
async function downloadFile(path) {
    const url = `/api/files/download?path=${encodeURIComponent(path)}`;
    window.location.href = url;
}

//search
async function searchFolder(path, term) {
    const url = `/api/files/search?path=${encodeURIComponent(path)}&searchTerm=${encodeURIComponent(term)}`;
    const response = await fetch (url);

    if(!response.ok) {
        throw new Error("Search failed.")
    }

    return await response.json();
}

function setSearchButton() {
    const searchButton = document.getElementById("searchButton");
    searchButton.addEventListener("click", performSearch);
}

function performSearch() {
    const searchBox = document.getElementById("searchBox");
    const term = searchBox.value.trim();
    const path = (new URLSearchParams(window.location.search)).get("path") || "";
    var url = "";
    if (term === "") {
        url = path ? `?path=${encodeURIComponent(path)}` : `?`;
    } else {
        url = `?path=${encodeURIComponent(path)}&search=${encodeURIComponent(term)}`;
    }
    history.pushState({}, "", url);
    loadView();
}


//create folder
function setCreateFolderButton() {
    const button = document.getElementById("createFolderButton");

    button.addEventListener("click", async () => {
        const folderName = prompt("Enter the new folder name:");
        createFolder((new URLSearchParams(location.search)).get("path") || "", folderName);
    });
}

async function createFolder(path, name) {
    if (name === null) return;
    //console.log("Creating folder at" + path + "named " + name);
    const url = `api/files/createfolder?name=${encodeURIComponent(name)}&path=${encodeURIComponent(path)}`;
    const response = await fetch(url, {method: "POST"});
    if (!response.ok) {
        throw new Error("Failed to create folder.");
    }

    await loadView();
}

//clear function
function clearField() {
    var inputFile = document.getElementById("uploadFile");
    inputFile.value = "";
    var inputSearch = document.getElementById("searchBox");
    inputSearch = "";
}

//get the size
function getSize(bytes) {
    if (bytes === 0) {
        return "0.00 B";
    }
    
    let e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + ' ' + ' KMGTP'.charAt(e) + 'B';
}

//display summary
function renderSummary(data) {
    const summaryBox = document.getElementById("summary");
    summary.innerHTML = "";

    summary.textContent = `${data.summary.folderCount} folders | ` + `${data.summary.fileCount} files | ` + `${getSize(data.summary.totalFileSize)}`;
}

//display error
function showError(message) {
    const box = document.getElementById("fileDisplay")
    box.innerHTML = "";

    const error = document.createElement("div");
    error.className = "error";
    error.textContent = `Error: ${message}`;

    box.appendChild(error);
}
