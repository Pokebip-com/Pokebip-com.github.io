let abilityPanel;
let banner;
let eventBannerList;
let eventQuestGroup;
let homeEventAppeal;
let legendQuestGroup;
let legendQuestGroupSchedule;
let schedule;
let scout;
let scoutPickup;
let storyQuest;

let versions;

let bannerText;
let eventName;
let scoutPickupDescr;

let monsterBase;
let monsterInfos;
let monsterNames;

let salonGuests;

let trainerBase;
let trainerExRole;
let trainerInfos;
let trainerInfosArray;
let trainerNames;
let trainerVerboseNames;

let treatedEvents;

let scheduleDiv;
let versionSelect;
const scrollTopBtn = document.getElementById('scrollTop');
const nextContentBtn = document.getElementById('nextContent');

const starsHex = ["#FFFFFF", "#bed9db", "#cfb19e", "#cbdbe3", "#ebe59a"];
const salonBannerPath = `./data/banner/event/update_4090_0W_Regular_01.png`;

// Textes des bannières du Combat de Maître Spécial
const CBEText1Id = 17503026;
const CBEText2Id = 27503027;
const role_names = ["Attaquant", "Attaquant", "Soutien", "Tacticien", "Accélérateur", "Régisseur"];

async function getData() {
    const [
        abilityPanelResponse,
        bannerResponse,
        championBattleEventResponse,
        championBattleEventQuestGroupResponse,
        eventBannerResponse,
        eventQuestGroupResponse,
        homeEventAppealResponse,
        itemSetResponse,
        legendQuestGroupResponse,
        legendQuestGroupScheduleResponse,
        monsterResponse,
        monsterBaseResponse,
        salonGuestResponse,
        scheduleResponse,
        scoutResponse,
        scoutPickupResponse,
        storyQuestResponse,
        trainerResponse,
        trainerBaseResponse,
        trainerExRoleResponse,
        villaQuestGroupResponse,
        bannerTextResponse,
        eventNameResponse,
        monsterNameResponse,
        scoutPickupDescrResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,
    ] = await Promise.all([
        fetch("./data/proto/AbilityPanel.json"),
        fetch("./data/proto/Banner.json"),
        fetch("./data/proto/ChampionBattleEvent.json"),
        fetch("./data/proto/ChampionBattleEventQuestGroup.json"),
        fetch("./data/proto/EventBanner.json"),
        fetch("./data/proto/EventQuestGroup.json"),
        fetch("./data/proto/HomeEventAppeal.json"),
        fetch("./data/proto/ItemSet.json"),
        fetch("./data/proto/LegendQuestGroup.json"),
        fetch("./data/proto/LegendQuestGroupSchedule.json"),
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/SalonGuest.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/Scout.json"),
        fetch("./data/proto/ScoutPickup.json"),
        fetch("./data/proto/StoryQuest.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch("./data/proto/TrainerExRole.json"),
        fetch("./data/proto/VillaQuestGroup.json"),
        fetch("./data/lsd/banner_text_fr.json"),
        fetch("./data/lsd/event_name_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/scout_pickup_description_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json"),
        fetch("./data/lsd/trainer_verbose_name_fr.json")
    ])
        .catch(error => console.log(error));

    abilityPanel = await abilityPanelResponse.json();
    abilityPanel = abilityPanel.entries;

    banner = await bannerResponse.json();
    banner = banner.entries;

    eventQuestGroup = await eventQuestGroupResponse.json();
    eventQuestGroup = eventQuestGroup.entries;

    let villaQuestGroup = await villaQuestGroupResponse.json();
    villaQuestGroup.entries.map(vqg => vqg.bannerId = 1202001);
    eventQuestGroup.push(...villaQuestGroup.entries);

    let champBattleEvent = await championBattleEventResponse.json();
    let champBattleEventQuestGroup = await championBattleEventQuestGroupResponse.json();

    champBattleEventQuestGroup.entries.map(cbeqg => {
        cbeqg.bannerId = champBattleEvent.entries.find(cbe => cbe.championBattleEventId === cbeqg.championBattleEventId).bannerId;

        banner.map(ban => {
            if(ban.bannerId === cbeqg.bannerId) {
                if(ban.text1Id == -1)
                    ban.text1Id = CBEText1Id;

                if(ban.text2Id == -1)
                    ban.text2Id = CBEText2Id;
            }
        });
    });
    eventQuestGroup.push(...champBattleEventQuestGroup.entries);

    schedule = await scheduleResponse.json();
    schedule = schedule.entries;

    scout = await scoutResponse.json();
    scout = scout.entries;

    scoutPickup = await scoutPickupResponse.json();
    scoutPickup = scoutPickup.entries;

    storyQuest = await storyQuestResponse.json();
    storyQuest = storyQuest.entries;

    bannerText = await bannerTextResponse.json();

    const eventBannerJSON = await eventBannerResponse.json();
    eventBannerList = eventBannerJSON.entries;

    eventName = await eventNameResponse.json();

    const homeEventAppealJSON = await homeEventAppealResponse.json();
    homeEventAppeal = homeEventAppealJSON.entries;

    scoutPickupDescr = await scoutPickupDescrResponse.json();

    const monstersJSON = await monsterResponse.json();
    monsterInfos = getBySpecificID(monstersJSON.entries, "monsterId");

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = getBySpecificID(monstersBaseJSON.entries, "monsterBaseId");

    const salonGuestJSON = await salonGuestResponse.json();
    salonGuests = salonGuestJSON.entries;

    trainerInfosArray = await trainerResponse.json();
    trainerInfosArray = trainerInfosArray.entries;
    trainerInfos = getBySpecificID(trainerInfosArray, "trainerId");

    const trainersBaseJSON = await trainerBaseResponse.json();
    trainerBase = getBySpecificID(trainersBaseJSON.entries, "id");

    trainerExRole = await trainerExRoleResponse.json();
    trainerExRole = trainerExRole.entries;

    monsterNames = await monsterNameResponse.json();
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();

    const itemSetJSON = await itemSetResponse.json();
    itemSet = getBySpecificID(itemSetJSON.entries, "itemSetId");

    const legendsQuestGroupJSON = await legendQuestGroupResponse.json();
    legendQuestGroup = getBySpecificID(legendsQuestGroupJSON.entries, "questGroupId");

    const legendsQuestGroupScheduleJSON = await legendQuestGroupScheduleResponse.json();
    legendQuestGroupSchedule = getBySpecificID(legendsQuestGroupScheduleJSON.entries, "scheduleId");
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

function getPairPrettyPrint(trainerId) {
    return `${getStarsRarityString(trainerId)} ${getTrainerName(trainerId)} & ${getMonsterNameByTrainerId(trainerId)}`;
}

function getStarsRarityString(trainerId) {
    var rarity = trainerInfos[trainerId][0].rarity;

    return `<span style="color: ${starsHex[rarity-1]}; -webkit-text-stroke: thin black;"><b>${"★".repeat(rarity)}</b></span>`;
}

function getTrainerName(id) {
    return trainerVerboseNames[id] || trainerNames[trainerBase[trainerInfos[id][0].trainerBaseId][0].trainerNameId] || "Dresseur (Scottie/Bettie)";
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
    let legendaryBattleIds = [...new Set(Object.keys(legendQuestGroupSchedule))];
    let salonGuestsUpdate = [...new Set(salonGuests.map(sg => sg.scheduleId))];
    let trainingAreaUpdate = [...new Set(storyQuest.filter(sq => sq.questType === 8).map(sq => sq.scheduleId))];

    for(let i = 0; i < versions.length; i++) {
        versions[i].schedule = schedule
            .filter(s => (scoutIds.includes(s.scheduleId) || eventIds.includes(s.scheduleId) || legendaryBattleIds.includes(s.scheduleId) || trainingAreaUpdate.includes(s.scheduleId) || salonGuestsUpdate.includes(s.scheduleId) || s.scheduleId.startsWith("chara_") || s.scheduleId.endsWith("_Shop_otoku")) && s.startDate >= versions[i].releaseTimestamp && (i === 0 || s.startDate < versions[i-1].releaseTimestamp))
            .map(s => {
                s.isLegendaryBattle = false;
                s.isHomeAppeal = false;

                if(scoutIds.includes(s.scheduleId)) {
                    s.type = { "name" : "scout", "priority": "10" };
                }
                else if(salonGuestsUpdate.includes(s.scheduleId)) {
                    s.type = { "name" : "salon", "priority": "30" };
                }
                else if(s.scheduleId.startsWith("chara_")) {
                    s.type = { "name" : "chara", "priority": "40" };
                }
                else if(s.scheduleId.endsWith("_Shop_otoku")) {
                    s.type = { "name" : "shop", "priority": "50" };
                }
                else {
                    s.type = { "name" : "event", "priority": "20" };

                    if(legendaryBattleIds.includes(s.scheduleId)) {
                        s.isLegendaryBattle = true;
                    }
                    if(trainingAreaUpdate.includes(s.scheduleId)) {
                        s.isHomeAppeal = true;
                    }
                }
                return s;
            })
            .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.type.priority.localeCompare(b.type.priority));

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
                scheduleDiv.innerHTML += `<li>${getPairPrettyPrint(sp.trainerId)}</li>\n`;
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

        eventQuestGroup.filter(eventQG => eventQG.questGroupId == qg)
            .forEach(eventQG => {
                let eventBanners = banner.filter(b => b.bannerId === eventQG.bannerId);

                eventBanners.forEach(eb => printEventBanner(eb, schedule));
            });
    });
}

function printPairChanges(scheduleId) {

    // Ajout de cases dans le plateau
    let panelChanges = [...new Set(abilityPanel.filter(ap => ap.scheduleId === scheduleId).map(ap => ap.trainerId))].map(tid => { return {"trainerId" : tid, "type": "panel", "text" : "Ajout de cases dans le plateau duo-gemme."}; });

    // Sortie de duo
    let trainerRelease = [...new Set(trainerInfosArray.filter(ti => ti.scheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "add", "text" : "Ajout du duo dans le jeu."}; });

    // Sortie du 6EX
    let trainerExRelease = [...new Set(trainerInfosArray.filter(ti => ti.exScheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "ex", "text" : "Ajout du 6★ EX."}; });

    // Sortie du Rôle EX
    let ExRoleRelease = [...new Set(trainerExRole.filter(ti => ti.scheduleId === scheduleId).map(ti => { return {"trainerId" : ti.trainerId, "role" : role_names[ti.role] }; }))].map(exRole => { return {"trainerId" : exRole.trainerId, "type" : "exRole", "text" : `Ajout du Rôle EX (${exRole.role}).`}; });

    let changes = trainerRelease.concat(trainerExRelease, ExRoleRelease, panelChanges).sort((a, b) => getTrainerName(a.trainerId).localeCompare(getTrainerName(b.trainerId)));

    let lastTID = "";

    scheduleDiv.innerHTML += "<ul>";

    for(let index in changes) {
        if(lastTID !== changes[index].trainerId) {
            if(lastTID !== "") {
                scheduleDiv.innerHTML += "<br />";
            }

            lastTID = changes[index].trainerId;

        }

        scheduleDiv.innerHTML += `<li><b>${getPairPrettyPrint(changes[index].trainerId)} : </b> ${changes[index].text}</li>`;
    }



}

function printSalonGuest(scheduleId) {
    let salonGuestList = [...new Set(salonGuests.filter(sg => sg.scheduleId === scheduleId).map(sg => sg.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "add", "text" : "Ajout au Salon des Dresseurs"}; });

    let lastTID = "";

    scheduleDiv.innerHTML += "<ul>";

    for(let index in salonGuestList) {
        if(lastTID !== salonGuestList[index].trainerId) {
            if(lastTID !== "") {
                scheduleDiv.innerHTML += "<br />";
            }

            lastTID = salonGuestList[index].trainerId;

        }

        scheduleDiv.innerHTML += `<li><b>${getPairPrettyPrint(salonGuestList[index].trainerId)} : </b> ${salonGuestList[index].text}</li>`;
    }
}

function printShopOffers(schedule) {
    let eventBanners = eventBannerList.filter(eb => eb.scheduleId === schedule.scheduleId);

    if(eventBanners.length === 0)
        return;

    eventBanners.forEach(eb => {
        let banners = banner.filter(b => b.bannerId === eb.bannerId);

        banners.forEach(ban => printEventBanner(ban, schedule));
    });
}

function printHomeAppealEvent(schedule) {
    const eventAppeal = homeEventAppeal.filter(hea => hea.bannerScheduleId === schedule.scheduleId);

    eventAppeal.forEach(ea => {
        let banners = banner.filter(b => b.bannerId === ea.bannerId);

        banners.forEach(ban => printEventBanner(ban, schedule));
    })
}

function printLegBat(schedule) {
    let banners = banner.filter(b => b.bannerId === legendQuestGroup[legendQuestGroupSchedule[schedule.scheduleId][0].questGroupId][0].bannerId);
    banners.forEach(ban => printEventBanner(ban, schedule));
}

function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(d.setDate(diff));
}

function printCalendars(startDates) {

    let date = getMonday(startDates[0]);
    let endDate = startDates[startDates.length-1];
    let lastPrintMonth = -1;
    let calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "";
    const today = new Date();

    let calTable;
    let calUl = document.createElement("ul");
    calUl.classList.add("listh-bipcode");

    calendarDiv.appendChild(calUl);

    do {
        if(lastPrintMonth !== date.getMonth()) {

            let calLi = document.createElement("li");
            calTable = document.createElement("table");
            let calThead = document.createElement("thead");
            let calTrMonth = document.createElement("tr");
            let calThMonth = document.createElement("th");

            calLi.classList.add("listh-no-style");
            calTable.classList.add("bipcode");

            calThMonth.innerText = date.toLocaleString("default", {month: 'long'});
            calThMonth.innerText = calThMonth.innerText.replace(/^./, calThMonth.innerText[0].toUpperCase());
            calThMonth.colSpan = 7;

            calTrMonth.appendChild(calThMonth);
            calThead.appendChild(calTrMonth);

            let calTrDays = document.createElement("tr");

            let calThMon = document.createElement("th");
            calThMon.innerText = "Lun.";
            calTrDays.appendChild(calThMon);

            let calThTue = document.createElement("th");
            calThTue.innerText = "Mar.";
            calTrDays.appendChild(calThTue);

            let calThWed = document.createElement("th");
            calThWed.innerText = "Mer.";
            calTrDays.appendChild(calThWed);

            let calThThu = document.createElement("th");
            calThThu.innerText = "Jeu.";
            calTrDays.appendChild(calThThu);

            let calThFri = document.createElement("th");
            calThFri.innerText = "Ven.";
            calTrDays.appendChild(calThFri);

            let calThSat = document.createElement("th");
            calThSat.innerText = "Sam.";
            calTrDays.appendChild(calThSat);

            let calThSun = document.createElement("th");
            calThSun.innerText = "Dim.";
            calTrDays.appendChild(calThSun);

            calThead.appendChild(calTrDays);

            calTable.appendChild(calThead);

            calLi.appendChild(calTable)
            calUl.appendChild(calLi);

            lastPrintMonth = date.getMonth();
        }

        let calDaysTr = document.createElement("tr");

        for(let i = 0; i < 7; i++) {
            let calDay = document.createElement("td");

            if(date.getMonth() === lastPrintMonth && (date.getDay()+6)%7 === i) {
                if(startDates.map(sd => sd.getTime()).includes(date.getTime())) {
                    calDay.innerHTML = `<b><a href="#${date.getFullYear()}${date.getMonth()}${date.getDate()}">${date.getDate().toString()}</a></b>`

                    if(nextContentBtn.getAttribute("href") === "#" && today < date) {
                        nextContentBtn.href = `#${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
                        nextContentBtn.style.display = "inline-flex";
                    }
                }
                else {
                    calDay.innerText = date.getDate().toString();
                }
                date.setDate(date.getDate() + 1);
            }

            calDaysTr.appendChild(calDay);
        }

        calTable.appendChild(calDaysTr);

    } while(date.getMonth() <= endDate.getMonth());
}

function setVersionInfos(id) {
    let version = versions.find(v => v.version === id);

    if(version === undefined)
        return;

    scheduleDiv.innerHTML = "";

    let scoutFlag, eventFlag, shopFlag, salonFlag, charaFlag;
    let startDates = [...new Set(version.schedule.map(s => s.startDate))].sort();

    printCalendars(startDates.map(t => new Date(t*1000)));

    startDates.forEach(timestamp => {

        scoutFlag = eventFlag = shopFlag = salonFlag = charaFlag = true;
        treatedEvents = [];

        let date = new Date(timestamp*1000);
        scheduleDiv.innerHTML += `<h1 id="${date.getFullYear()}${date.getMonth()}${date.getDate()}" style="margin-top: 50px; scroll-margin-top: 2.8em">${new Intl.DateTimeFormat('fr-FR', {dateStyle: 'full', timeStyle: 'short'}).format(date)}</h1>\n`;

        version.schedule.filter(schedule => schedule.startDate === timestamp).forEach(sched => {

            switch(sched.type.name) {
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

                    if(sched.isLegendaryBattle) {
                        printLegBat(sched);
                        break;
                    }

                    if(sched.isHomeAppeal) {
                        printHomeAppealEvent(sched)
                        break;
                    }

                    printEvents(sched);
                    break;

                case "shop":
                    if(shopFlag) {
                        scheduleDiv.innerHTML += "<h2>Offres de diamants</h2>";
                        shopFlag = false;
                    }
                    printShopOffers(sched);
                    break;

                case "salon":
                    if(salonFlag) {
                        scheduleDiv.innerHTML += "<h2>Salon des Dresseurs</h2>";
                        scheduleDiv.innerHTML += `<img src="${salonBannerPath}" />`;
                        salonFlag = false;
                    }
                    printSalonGuest(sched.scheduleId);
                    break;

                case "chara":
                    if(charaFlag) {
                        scheduleDiv.innerHTML += "<h2>Ajouts/Modif. de Duos</h2>";
                        charaFlag = false;
                    }
                    printPairChanges(sched.scheduleId);
            }
        })
    });
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;
    nextContentBtn.href = "#"
    nextContentBtn.style.display = "none";

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

    //const leftSchedule = schedule.filter(s => s.startDate >= versions[0].releaseTimestamp && !versions[0].schedule.includes(s));
    //console.log(leftSchedule);
}

scrollTopBtn.addEventListener('click', () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
})

init();
