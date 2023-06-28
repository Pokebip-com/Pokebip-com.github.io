let schedule;

let versions;

let versionSelect;

async function getData() {
    const [
        scheduleResponse,
    ] = await Promise.all([
        fetch("./data/proto/Schedule.json")
    ])
        .catch(error => console.log(error));

    schedule = await scheduleResponse.json();
    schedule = schedule.entries;
}

async function getCustomJSON() {
    const [
        versionsResponse
    ] = await Promise.all([
        fetch("./data/custom/version_release_dates.json")
    ])
        .catch(error => console.log(error));

    versions = await versionsResponse.json().then(orderByVersion);
}

class Version {
    constructor(version) {
        let expl = version.split(".");

        this.major = parseInt(expl[0]);
        this.minor = parseInt(expl[1]) || 0;
        this.patch = parseInt(expl[2]) || 0;
    }
}

function orderByVersion(data) {

    return data.versions.sort((a, b) => {
        const verA = new Version(a.version);
        const verB = new Version(b.version);

        if(verA.major > verB.major) return -1;
        if(verA.major < verB.major) return 1;

        if(verA.minor > verB.minor) return -1;
        if(verA.minor < verB.minor) return 1;

        if(verA.patch > verB.patch) return -1;
        if(verA.patch < verB.patch) return 1;
    });
}

function scheduleByVersion() {
    while(versionSelect.length > 0) {
        versionSelect.remove(0);
    }

    for(let i = 0; i < versions.length; i++) {
        versions[i].schedule = schedule
            .filter(s => s.startDate >= versions[i].releaseTimestamp && (i === 0 || s.startDate < versions[i-1].releaseTimestamp))
            .sort((a, b) => {
                if(a.startDate > b.startDate) return 1;
                if(a.startDate < b.startDate) return -1;

                if(a.endDate > b.endDate) return 1;
                if(a.endDate < b.endDate) return -1;

                return a.scheduleId.localeCompare(b.scheduleId);
            });

        let date = new Date(versions[i].releaseTimestamp);

        let option = {};
        option.value = versions[i].version;
        option.text = `Version ${versions[i].version} (${date.toLocaleDateString('fr-fr', {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }

    console.log(versions);
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;

    //setAnchors(id);
    if(setUrl)
        setUrlEventID(versionSelect.value);
}

function setUrlEventID(id) {
    const url = new URL(window.location);
    url.searchParams.set('version', id);

    window.history.pushState(null, '', url.toString());
}

async function init() {
    versionSelect = document.getElementById("versionSelect");
    btnCopy = document.getElementById("btnCopy");
    textarea = document.getElementById("area");

    await getData();
    await getCustomJSON();

    scheduleByVersion();

    versionSelect.onchange = function() {
        setVersion(versionSelect.value);
    };

    btnCopy.onclick = function() {
        navigator.clipboard.writeText(textarea.value);
    };

    const url = new URL(window.location);
    const urlVersionId = url.searchParams.get('version');

    if(urlVersionId !== null) {
        versionSelect.value = urlVersionId;
    }

    setVersion(versionSelect.value);
/*
    gridTable = document.getElementById("gridTable");
    statsTable = document.getElementById("statsTable");
    updatedGridsSpan = document.getElementById("updatedGrids");

    setPassiveList();
    setConditionsAndAbilities();

    abilityPanelByTrainer = getAbilitiesByTrainerID(abilityPanelByTrainer);

    Object.keys(abilityPanelByTrainer).forEach(trainerID => {
        abilityPanelByTrainer[trainerID].oldNbCells = lastUpdateGrids[trainerID] || 0;
    });

    sortCells();
    populateSelect();

    */
}

init();