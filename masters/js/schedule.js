let banner;
let schedule;
let scout;
let scoutPickup;

let versions;

let bannerText;
let scoutPickupDescr;

let monsterBase;
let monsterInfos;
let monsterNames;

let trainerBase;
let trainerInfos;
let trainerNames;

let scoutsDiv;
let versionSelect;

async function getData() {
    const [
        bannerResponse,
        monsterResponse,
        monsterBaseResponse,
        scheduleResponse,
        scoutResponse,
        scoutPickupResponse,
        trainerResponse,
        trainerBaseResponse,
        bannerTextResponse,
        monsterNameResponse,
        scoutPickupDescrResponse,
        trainerNameResponse
    ] = await Promise.all([
        fetch("./data/proto/Banner.json"),
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/Scout.json"),
        fetch("./data/proto/ScoutPickup.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch("./data/lsd/banner_text_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/scout_pickup_description_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json")
    ])
        .catch(error => console.log(error));

    banner = await bannerResponse.json();
    banner = banner.entries;

    schedule = await scheduleResponse.json();
    schedule = schedule.entries;

    scout = await scoutResponse.json();
    scout = scout.entries;

    scoutPickup = await scoutPickupResponse.json();
    scoutPickup = scoutPickup.entries;

    bannerText = await bannerTextResponse.json();

    scoutPickupDescr = await scoutPickupDescrResponse.json();

    const monstersJSON = await monsterResponse.json();
    monsterInfos = getBySpecificID(monstersJSON.entries, "monsterId");

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = getBySpecificID(monstersBaseJSON.entries, "monsterBaseId");

    const trainersJSON = await trainerResponse.json();
    trainerInfos = getBySpecificID(trainersJSON.entries, "trainerId");

    const trainersBaseJSON = await trainerBaseResponse.json();
    trainerBase = getBySpecificID(trainersBaseJSON.entries, "id");

    monsterNames = await monsterNameResponse.json();
    trainerNames = await trainerNameResponse.json();
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

function getBySpecificID(data, id) {
    return data.reduce(function (r, a) {
        r[a[id]] = r[a[id]] || [];
        r[a[id]].push(a);
        return r;
    }, {});
}

function getTrainerName(id) {
    return trainerNames[trainerBase[trainerInfos[id][0].trainerBaseId][0].trainerNameId] || "Dresseur (Scottie/Bettie)";
}

function getMonsterNameByTrainerId(id) {
    return monsterNames[monsterBase[monsterInfos[trainerInfos[id][0].monsterId][0].monsterBaseId][0].monsterNameId];
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

    let scoutIds = scout.map(s => s.scheduleId);

    console.log(scout);
    console.log(scoutPickup);

    for(let i = 0; i < versions.length; i++) {
        versions[i].schedule = schedule
            .filter(s => scoutIds.includes(s.scheduleId) && s.startDate >= versions[i].releaseTimestamp && (i === 0 || s.startDate < versions[i-1].releaseTimestamp))
            .sort((a, b) => {
                if(a.startDate > b.startDate) return 1;
                if(a.startDate < b.startDate) return -1;

                if(a.endDate > b.endDate) return 1;
                if(a.endDate < b.endDate) return -1;

                return a.scheduleId.localeCompare(b.scheduleId);
            });

        let date = new Date(versions[i].releaseTimestamp*1000);

        let option = {};
        option.value = versions[i].version;
        option.text = `Version ${versions[i].version} (${date.toLocaleDateString('fr-fr', {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }

    console.log(versions);
}

function setVersionScouts(id) {
    let version = versions.find(v => v.version === id);

    if(version === undefined)
        return;

    let lastStart = 0;

    scoutsDiv.innerHTML = "";

    version.schedule.forEach(sched => {
        scout.filter(sc => sc.scheduleId === sched.scheduleId)
            .forEach(schedScout => {
                let sPickups = scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);
                let scoutBanners = banner.filter(b => b.bannerId === schedScout.bannerId);

                if(sched.startDate > lastStart) {
                    console.log("---------");
                    lastStart = sched.startDate;
                    let date = new Date(sched.startDate*1000);
                    scoutsDiv.innerHTML += `<h1 style="margin-top: 50px">${new Intl.DateTimeFormat('fr-FR', {dateStyle: 'medium', timeStyle: 'short'}).format(date)}</h1>\n`;
                }

                scoutBanners.forEach(sb => {
                    let h2 = `<h2>${bannerText[sb.text1Id]}`;

                    if(sb.text2Id > -1) {
                        h2 += `<br />${bannerText[sb.text2Id]}`;
                    }

                    h2 += "</h2>";

                    scoutsDiv.innerHTML += h2;

                    if(sb.bannerIdString !== "") {
                        scoutsDiv.innerHTML += `<img src="./data/banner/scout/${sb.bannerIdString}.png" />\n`;
                    }
                })

                if(sPickups.length > 0) {
                    scoutsDiv.innerHTML += `<h3>Duos à l'affiche</h3>\n<ul style='list-style-type: disc;'>\n`;


                    sPickups.forEach(sp => {
                        scoutsDiv.innerHTML += `<li>${getTrainerName(sp.trainerId)} & ${getMonsterNameByTrainerId(sp.trainerId)}</li>\n`;
                    });

                    scoutsDiv.innerHTML += "</ul>\n";
                }

                console.log(sched);
                console.log(schedScout);
                console.log(sPickups);
                console.log(scoutBanners);
            })
    })
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;

    setVersionScouts(id);
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
    scoutsDiv = document.getElementById("scoutsDiv");

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