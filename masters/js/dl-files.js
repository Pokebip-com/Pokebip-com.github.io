const API_DIR = "https://api.github.com/repos/Pokebip-com/Pokebip-com.github.io/contents/masters/data/";
const ARCHIVES_PATH = "https://github.com/Pokebip-com/Pokebip-com.github.io/releases/download/v";
const ARCHIVE_NAME = "Pokemon-Masters-Diff.zip";
const dlProtosBtn = document.getElementById("dlProtosBtn");
const dlLsdBtn = document.getElementById("dlLsdBtn");
const dlInfosDiv = document.getElementById("dlInfos");
const versionSelect = document.getElementById("versionSelect");
const dlVersionDiv = document.getElementById("dlVersionFilesBtn");

dlProtosBtn.addEventListener('click', () => downloadData("proto"));
dlLsdBtn.addEventListener('click', () => downloadData("lsd"));
dlVersionDiv.addEventListener('click', () => downloadArchive(versionSelect.value));

async function getData() {
    await buildHeader();

    jsonCache.preloadCustom("version_release_dates");

    await jsonCache.runPreload();
}

async function downloadData(dirName) {
    const dirDataUrl = API_DIR + dirName;

    dlProtosBtn.disabled = true;
    dlLsdBtn.disabled = true;

    let response = await fetch(dirDataUrl);
    let data = await response.json();

    const zip = new JSZip();

    for(const fileInfos of data) {
        dlInfosDiv.innerHTML = `Fetching and adding <strong>${fileInfos.name}</strong> to zip file...`;

        let res = await fetch(fileInfos.download_url);
        let fileData = await res.text();

        zip.file(fileInfos.name, fileData);
    }

    dlInfosDiv.innerHTML = `Generating zip...`;

    zip.generateAsync({ type: 'blob'}).then((content) => saveAs(content, dirName + ".zip")).then(() => {
        dlProtosBtn.disabled = false;
        dlLsdBtn.disabled = false;
        dlInfosDiv.innerHTML = `Downloading  <strong>${dirName}.zip</strong>`;
    });
}

function downloadArchive(version) {
    if (!version) return;

    const url = `${ARCHIVES_PATH}${version}/${ARCHIVE_NAME}`;
    dlInfosDiv.innerHTML = `Downloading  <strong>${ARCHIVE_NAME}</strong>...`;

    saveAs(url);
}

getData().then(() => {
    jData.custom.versionReleaseDates.filter(v => v.hasArchive).forEach(ver => {
        let opt = document.createElement("option")
        opt.value = ver.version;
        opt.textContent = ver.version;
        versionSelect.appendChild(opt);
    });
});
