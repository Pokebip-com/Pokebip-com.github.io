let banner;
let eventQuestGroup;
let schedule;
let scout;
let scoutPickup;
let specialChampionBattle;
let storyQuest;

let versions;

let bannerText;
let eventName;
let scoutPickupDescr;

let monsterBase;
let monsterInfos;
let monsterNames;

let trainerBase;
let trainerInfos;
let trainerNames;

let treatedEvents;

let scheduleDiv;
let versionSelect;

const starsHex = ["#FFFFFF", "#bed9db", "#cfb19e", "#cbdbe3", "#ebe59a"];

async function getData() {
    const [
        bannerResponse,
        eventQuestGroupResponse,
        monsterResponse,
        monsterBaseResponse,
        scheduleResponse,
        scoutResponse,
        scoutPickupResponse,
        storyQuestResponse,
        trainerResponse,
        trainerBaseResponse,
        villaQuestGroupResponse,
        bannerTextResponse,
        eventNameResponse,
        monsterNameResponse,
        scoutPickupDescrResponse,
        trainerNameResponse
    ] = await Promise.all([
        fetch("./data/proto/Banner.json"),
        fetch("./data/proto/EventQuestGroup.json"),
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/Scout.json"),
        fetch("./data/proto/ScoutPickup.json"),
        fetch("./data/proto/StoryQuest.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch("./data/proto/VillaQuestGroup.json"),
        fetch("./data/lsd/banner_text_fr.json"),
        fetch("./data/lsd/event_name_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/scout_pickup_description_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json")
    ])
        .catch(error => console.log(error));

    banner = await bannerResponse.json();
    banner = banner.entries;

    eventQuestGroup = await eventQuestGroupResponse.json();
    eventQuestGroup = eventQuestGroup.entries;

    let villaQuestGroup = await villaQuestGroupResponse.json();
    villaQuestGroup.entries.map(vqg => vqg.bannerId = 1202001);
    eventQuestGroup.push(...villaQuestGroup.entries);

    schedule = await scheduleResponse.json();
    schedule = schedule.entries;

    scout = await scoutResponse.json();
    scout = scout.entries;

    scoutPickup = await scoutPickupResponse.json();
    scoutPickup = scoutPickup.entries;

    storyQuest = await storyQuestResponse.json();
    storyQuest = storyQuest.entries;

    bannerText = await bannerTextResponse.json();

    eventName = await eventNameResponse.json();

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
        specialChampionBattleResponse,
        versionsResponse
    ] = await Promise.all([
        fetch("./data/custom/special_champion_battle.json"),
        fetch("./data/custom/version_release_dates.json")
    ])
        .catch(error => console.log(error));

    specialChampionBattle = await specialChampionBattleResponse.json();
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
    let eventIds = [...new Set(storyQuest.map(sq => sq.scheduleId))];

    for(let i = 0; i < versions.length; i++) {
        versions[i].schedule = schedule
            .filter(s => (scoutIds.includes(s.scheduleId) || eventIds.includes(s.scheduleId)) && s.startDate >= versions[i].releaseTimestamp && (i === 0 || s.startDate < versions[i-1].releaseTimestamp))
            .map(s => {
                if(scoutIds.includes(s.scheduleId)) {
                    s.type = "scout";
                }
                else {
                    s.type = "event";
                }
                return s;
            })
            .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.type.localeCompare(b.type)*(-1));

        let date = new Date(versions[i].releaseTimestamp*1000);

        let option = {};
        option.value = versions[i].version;
        option.text = `Version ${versions[i].version} (${date.toLocaleDateString('fr-fr', {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }
}

function printEndDate(timestamp) {
    let endDate = new Intl.DateTimeFormat('fr-FR', {dateStyle: 'full', timeStyle: 'short'}).format(new Date(timestamp*1000-1));
    scheduleDiv.innerHTML += `<br /><br /><strong>Date de fin : </strong> ${endDate}`;
}

function printScouts(schedule) {
    let scheduleScouts = scout.filter(sc => sc.scheduleId === schedule.scheduleId);

    if(scheduleScouts.length === 0)
        return;

    scheduleScouts.forEach(schedScout => {
        let scoutBanners = banner.filter(b => b.bannerId === schedScout.bannerId);

        scoutBanners.forEach(sb => {
            let h3 = `<h3>${bannerText[sb.text1Id]}`;

            if(sb.text2Id > -1) {
                h3 += ` ${bannerText[sb.text2Id]}`;
            }

            h3 += "</h3>";

            scheduleDiv.innerHTML += h3;

            if(sb.bannerIdString !== "") {
                scheduleDiv.innerHTML += `<img src="./data/banner/scout/${sb.bannerIdString}.png" />\n`;
            }
        });

        printEndDate(schedule.endDate);

        let sPickups = scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);


        if(sPickups.length > 0) {
            scheduleDiv.innerHTML += `<h4>Duos à l'affiche</h4>\n<ul style='list-style-type: disc;'>\n`;


            sPickups.forEach(sp => {
                var rarity = trainerInfos[sp.trainerId][0].rarity;
                scheduleDiv.innerHTML += `<li><span style="color: ${starsHex[rarity-1]}; -webkit-text-stroke-color: black; -webkit-text-stroke-width: 1px;">${"★".repeat(rarity)}</span> ${getTrainerName(sp.trainerId)} & ${getMonsterNameByTrainerId(sp.trainerId)}</li>\n`;
            });

            scheduleDiv.innerHTML += "</ul>\n";
        }
    });
}

function printEventBanner(eventBanner, eventSchedule) {
    let h3 = `<h3>${bannerText[eventBanner.text1Id]}`;

    if(eventBanner.text2Id > -1) {
        h3 += ` ${bannerText[eventBanner.text2Id]}`;
    }

    h3 += "</h3>";

    scheduleDiv.innerHTML += h3;

    if(eventBanner.bannerIdString !== "") {
        scheduleDiv.innerHTML += `<img src="./data/banner/event/${eventBanner.bannerIdString}.png" />\n`;
    }

    printEndDate(eventSchedule.endDate);
}

function printEvents(schedule) {
    let scheduleQuests = storyQuest.filter(quest => quest.scheduleId === schedule.scheduleId);

    if(scheduleQuests.length === 0)
        return;

    let questGroups = [...new Set(scheduleQuests.map(sq => sq.questGroupId))];

    questGroups.forEach(qg => {
        if(treatedEvents.includes(qg))
            return;
        else
            treatedEvents.push(qg);

        if(schedule.scheduleId.endsWith("_Event_ChampionBattle")) {
            console.log(scheduleQuests);
            console.log("YES !!!!");
            if(schedule.scheduleId in specialChampionBattle) {
                printEventBanner(specialChampionBattle[schedule.scheduleId].Banner, schedule);
            }

            return;
        }

        eventQuestGroup.filter(eventQG => eventQG.questGroupId === qg)
            .forEach(eventQG => {

                let eventBanners = banner.filter(b => b.bannerId === eventQG.bannerId);

                eventBanners.forEach(eb => printEventBanner(eb, schedule));
            });
    });
}

function setVersionInfos(id) {
    let version = versions.find(v => v.version === id);

    if(version === undefined)
        return;

    scheduleDiv.innerHTML = "";

    let scoutFlag, eventFlag;
    let startDates = [...new Set(version.schedule.map(s => s.startDate))].sort();

    startDates.forEach(timestamp => {

        scoutFlag = eventFlag = true;
        treatedEvents = [];

        let date = new Date(timestamp*1000);
        scheduleDiv.innerHTML += `<h1 style="margin-top: 50px">${new Intl.DateTimeFormat('fr-FR', {dateStyle: 'full', timeStyle: 'short'}).format(date)}</h1>\n`;

        version.schedule.filter(schedule => schedule.startDate === timestamp).forEach(sched => {

            switch(sched.type) {
                case "scout":
                    if(scoutFlag) {
                        scheduleDiv.innerHTML += "<h2>Appels Duo</h2>";
                        scoutFlag = false;
                    }
                    printScouts(sched);
                    break;

                case "event":
                    if(eventFlag) {
                        scheduleDiv.innerHTML += "<h2>Événements</h2>";
                        eventFlag = false;
                    }
                    printEvents(sched);
                    break;
            }
        })
    });
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;

    setVersionInfos(id);
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
    scheduleDiv = document.getElementById("scheduleDiv");

    await getData();
    await getCustomJSON();

    scheduleByVersion();

    versionSelect.onchange = function() {
        setVersion(versionSelect.value);
    };

    const url = new URL(window.location);
    const urlVersionId = url.searchParams.get('version');

    if(urlVersionId !== null) {
        versionSelect.value = urlVersionId;
    }

    setVersion(versionSelect.value);
}

init();
