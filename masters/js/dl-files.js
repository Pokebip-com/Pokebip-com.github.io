const dlProtosBtn = document.getElementById("dlProtosBtn");
const dlLsdBtn = document.getElementById("dlLsdBtn");
const dlInfosDiv = document.getElementById("dlInfos");

dlProtosBtn.addEventListener('click', () => downloadData("proto"));
dlLsdBtn.addEventListener('click', () => downloadData("lsd"));

async function downloadData(dirName) {
    const dirDataUrl = "https://api.github.com/repos/Pokebip-com/Pokebip-com.github.io/contents/masters/data/" + dirName;

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

buildHeader().then();
