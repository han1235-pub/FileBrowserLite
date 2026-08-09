document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded");

    setUploadButton();
    setCreateFolderButton();
    loadView();

    window.addEventListener("popstate",loadView);
})


//load view when finished loading folder or searching = fetch for search/browse and render
async function loadView() {
    console.log("called loadView()");

    const params = new URLSearchParams(location.search);
    const path = params.get("path") || "";
    const searchTerm = params.get("search") || "";

    // setUploadButton(path);
    // setCreateFolderButton(path);

    try {
        if (searchTerm.trim() !== "") {
            const result = "";
            //await searchFiles(path, searchTerm);
            //render search
        } else {
            console.log("Begin loading folder path " + path);
            const result = await browseFolder(path);
            renderFolder(result);
        }
    } catch (error) {
        //display error
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
    console.log("called renderFolder()");

    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";
    data.items.forEach(item => {
        const div = document.createElement("div");
        div.className = "fileRow";
        div.textContent = `${item.name}\t\t${item.type}`;

        div.style.cursor = "pointer";
        
        if (item.type === "folder") {
            div.addEventListener("click", () => {
                console.log("CLICKED:", item.revPath);
                openFolder(item.revPath);
            });
        }

        if (item.type === "file") {
            div.addEventListener("click", () => {
                console.log("CLICKED:", item.revPath);
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
        //error
    }
    
    await loadView();
}

function setUploadButton() {
    const uploadButton = document.getElementById("uploadButton");
    const inputFile = document.getElementById("uploadFile");
    inputFile.value = "";

    uploadButton.addEventListener("click", async () => {
        if (!inputFile.files.length) {
            console.log("no file input");
            return;
        }

        try {
            console.log("uploading file");
            const file = inputFile.files[0];
            await uploadFile(file, (new URLSearchParams(location.search)).get("path") || "");
        } catch (error) {
            //show error
        }
    });
}

//download
async function downloadFile(path) {
    const url = `/api/files/download?path=${encodeURIComponent(path)}`;
    window.location.href = url;
}

//search


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
        //display error
    }

    await loadView();
}

