let abilityPanel;
let banner;
let eventBannerList;
let eventQuestGroup;
let itemExchange;
let homeEventAppeal;
let legendQuestGroup;
let legendQuestGroupSchedule;

let schedule;
let scoutIds;
let eventIds;
let loginBonusIds;
let legendaryBattleIds;
let salonGuestsUpdate;
let mainStoryUpdate;
let trainingAreaUpdate;

let scout;
let scoutPickup;
let storyQuest;

let versions;

let bannerText;
let eventName;
let itemSet;
let loginBonus;
let loginBonusReward;
let loginBonusName;
let jukeboxMusicName;
let scoutPickupDescr;

let monsterBase;
let monster;
let monsterNames;

let motifTypeName;

let salonGuests;

let trainerBase;
let trainerExRole;
let trainer;
let trainerInfosArray;
let trainerNames;
let trainerVerboseNames;

let treatedEvents;

let scheduleDiv;
let versionSelect;
let toolsDiv;
let startDateInput;
let endDateInput;
let downloadButton;

const scrollTopBtn = document.getElementById('scrollTop');
const nextContentBtn = document.getElementById('nextContent');

const salonBannerPath = `./data/banner/event/update_4090_0W_Regular_01.png`;

// Textes des bannières du Combat de Maître Spécial
const CBEText1Id = 17503026;
const CBEText2Id = 27503027;

async function getData() {
    const [
        abilityPanelResponse,
        bannerResponse,
        challengeToStrongTrainerQuestGroupResponse,
        championBattleEventResponse,
        championBattleEventQuestGroupResponse,
        eventBannerResponse,
        eventQuestGroupResponse,
        homeEventAppealResponse,
        itemExchangeResponse,
        itemSetResponse,
        legendQuestGroupResponse,
        legendQuestGroupScheduleResponse,
        loginBonusResponse,
        loginBonusRewardResponse,
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
        jukeboxMusicNameResponse,
        loginBonusNameResponse,
        monsterNameResponse,
        motifTypeNameResponse,
        scoutPickupDescrResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,
    ] = await Promise.all([
        fetch("./data/proto/AbilityPanel.json"),
        fetch("./data/proto/Banner.json"),
        fetch("./data/proto/ChallengeToStrongTrainerQuestGroup.json"),
        fetch("./data/proto/ChampionBattleEvent.json"),
        fetch("./data/proto/ChampionBattleEventQuestGroup.json"),
        fetch("./data/proto/EventBanner.json"),
        fetch("./data/proto/EventQuestGroup.json"),
        fetch("./data/proto/HomeEventAppeal.json"),
        fetch("./data/proto/ItemExchange.json"),
        fetch("./data/proto/ItemSet.json"),
        fetch("./data/proto/LegendQuestGroup.json"),
        fetch("./data/proto/LegendQuestGroupSchedule.json"),
        fetch("./data/proto/LoginBonus.json"),
        fetch("./data/proto/LoginBonusReward.json"),
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
        fetch("./data/lsd/jukebox_music_name_fr.json"),
        fetch("./data/lsd/login_bonus_name_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/motif_type_name_fr.json"),
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

    let challengeToStrongTrainerQuestGroup = await challengeToStrongTrainerQuestGroupResponse.json();
    eventQuestGroup.push(...challengeToStrongTrainerQuestGroup.entries);

    scout = await scoutResponse.json();
    scout = scout.entries;

    scoutPickup = await scoutPickupResponse.json();
    scoutPickup = scoutPickup.entries;

    storyQuest = await storyQuestResponse.json();
    storyQuest = storyQuest.entries;

    const salonGuestJSON = await salonGuestResponse.json();
    salonGuests = salonGuestJSON.entries;

    const legendsQuestGroupJSON = await legendQuestGroupResponse.json();
    legendQuestGroup = getBySpecificID(legendsQuestGroupJSON.entries, "questGroupId");

    const legendsQuestGroupScheduleJSON = await legendQuestGroupScheduleResponse.json();
    legendQuestGroupSchedule = getBySpecificID(legendsQuestGroupScheduleJSON.entries, "scheduleId");

    schedule = await scheduleResponse.json();
    getSchedule();

    bannerText = await bannerTextResponse.json();

    const eventBannerJSON = await eventBannerResponse.json();
    eventBannerList = eventBannerJSON.entries;

    eventName = await eventNameResponse.json();

    const itemExchangeJSON = await itemExchangeResponse.json();
    itemExchange = itemExchangeJSON.entries;

    const lastScheduleStartDate = Math.max(...new Set(schedule.map(s => s.startDate*1)));

    const loginBonusJSON = await loginBonusResponse.json();
    loginBonus = loginBonusJSON.entries.filter(lb => lb.startDate <= lastScheduleStartDate).map(lb => {
        lb.scheduleId = lb.loginBonusId;
        lb.startDate = lb.startDate.toString();
        lb.endDate = lb.endDate.toString();
        return lb;
    });

    loginBonusIds = loginBonus.map(lb => lb.loginBonusId);

    loginBonusName = await loginBonusNameResponse.json();

    schedule.push(...loginBonus);

    const loginBonusRewardJSON = await loginBonusRewardResponse.json();
    loginBonusReward = loginBonusRewardJSON.entries;

    jukeboxMusicName = await jukeboxMusicNameResponse.json();

    const homeEventAppealJSON = await homeEventAppealResponse.json();
    homeEventAppeal = homeEventAppealJSON.entries;

    scoutPickupDescr = await scoutPickupDescrResponse.json();

    const monstersJSON = await monsterResponse.json();
    monster = monstersJSON.entries;

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = monstersBaseJSON.entries;

    const trainerJSON = await trainerResponse.json();
    trainer = trainerJSON.entries;

    const trainersBaseJSON = await trainerBaseResponse.json();
    trainerBase = trainersBaseJSON.entries;

    trainerExRole = await trainerExRoleResponse.json();
    trainerExRole = trainerExRole.entries;

    motifTypeName = await motifTypeNameResponse.json();

    monsterNames = await monsterNameResponse.json();
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();

    const itemSetJSON = await itemSetResponse.json();
    itemSet = itemSetJSON.entries;
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

function getSchedule() {

    scoutIds = scout.map(s => s.scheduleId);
    eventIds = [...new Set(storyQuest.map(sq => sq.scheduleId))];
    legendaryBattleIds = [...new Set(Object.keys(legendQuestGroupSchedule))];
    salonGuestsUpdate = [...new Set(salonGuests.map(sg => sg.scheduleId))];
    mainStoryUpdate = [...new Set(storyQuest.filter(sq => sq.questType === "MainStory").map(sq => sq.scheduleId))];
    trainingAreaUpdate = [...new Set(storyQuest.filter(sq => sq.questType === 8).map(sq => sq.scheduleId))];

    schedule = schedule.entries.filter(s =>
        scoutIds.includes(s.scheduleId)
        || eventIds.includes(s.scheduleId)
        || legendaryBattleIds.includes(s.scheduleId)
        || mainStoryUpdate.includes(s.scheduleId)
        || trainingAreaUpdate.includes(s.scheduleId)
        || salonGuestsUpdate.includes(s.scheduleId)
        || s.scheduleId.startsWith("chara_")
        || s.scheduleId.endsWith("_Shop_otoku")
        || s.scheduleId.endsWith("_musiccoin_FOREVER")
    );
}

function getBySpecificID(data, id) {
    return data.reduce(function (r, a) {
        r[a[id]] = r[a[id]] || [];
        r[a[id]].push(a);
        return r;
    }, {});
}



function getScoutNewsText(schedule) {
    let scheduleScouts = scout.filter(sc => sc.scheduleId === schedule.scheduleId);

    if(scheduleScouts.length === 0)
        return;

    let newsText = "";

    scheduleScouts.forEach(schedScout => {
        let scoutBanners = banner.filter(b => b.bannerId === schedScout.bannerId);

        scoutBanners.forEach(sb => {
            newsText += `[h3]${bannerText[sb.text1Id].replaceAll("\n", " ")}`;

            if(sb.text2Id > -1) {
                newsText += ` ${bannerText[sb.text2Id].replaceAll("\n", " ")}`;
            }

            newsText += "[/h3]\n\n";
        });

        newsText += "[center][img]-[/img][/center]\n\n";

        let sPickups = scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);

        if(sPickups.length > 0) {
            newsText += "[listh]\n" +
                "[item|nostyle][table]\n" +
                "\t[tr][th|colspan=3]Duos à l'affiche[/th][th]Rôles[/th][th]Type[/th][th]Potentiel[/th][th]Plateau[/th][/tr]\n";

            sPickups.forEach(sp => {
                newsText += "\t[tr]\n" +
                    `\t\t[td]${getTrainerNumber(sp.trainerId)}[/td]\n` +
                    `\t\t[td][url=/page/jeuxvideo/pokemon-masters/duos/LIEN-DU-DUO]` +
                    `[img|w=80]/pages/jeuxvideo/pokemon-masters/images/personnages/bustes/PERSO.png[/img]\n` +
                    `\t\t[b]${getTrainerName(sp.trainerId).replaceAll("\n", "[br]")}[/b][/url][/td]\n` +
                    `\t\t[td]` +
                    `[img|w=80]/pages/icones/poke/MX/NUMERO.png[/img]\n` +
                    `\t\t[b]${getMonsterNameByTrainerId(sp.trainerId)}[/b][/td]\n` +
                    `\t\t[td][type=${removeAccents(getRoleByTrainerId(sp.trainerId).toLowerCase()).replace(" ", "-")}|MX]`;

                let exRole = getExRoleText(sp.trainerId);

                if(exRole !== null) {
                    newsText += `[br][type=${removeAccents(exRole.toLowerCase())}-ex|MX]`;
                }

                newsText += `[/td]\n` +
                    `\t\t[td][type=${removeAccents(getTrainerTypeName(sp.trainerId).toLowerCase())}|MX][/td]\n` +
                    `\t\t[td]${"★".repeat(getTrainerRarity(sp.trainerId))}`;

                if(hasExUnlocked(sp.trainerId)) {
                    newsText += `[br][type=ex|MX]`;
                }

                newsText += `[/td]\n` +
                    `\t\t[td]${getAbilityPanelQty(sp.trainerId)} cases[/td]\n` +
                    `\t[/tr]\n`;
            });

            newsText += "[/table][/item]\n\n" +
                "[item|nostyle][table]\n" +
                "\t[tr][th]Fin de l'affiche[/th][/tr]\n" +
                `\t[tr][td]${getDayMonthDate(new Date(schedule.endDate*1000-1))}[/td][/tr]\n` +
                "[/table][/item]\n" +
                "[/listh]\n\n";
        }
    });

    return newsText;
}

function getLegBatNewsText(schedule) {

}

function getHomeAppealEventNewsText(schedule) {

}

function getEventNewsText(schedule) {

}

function getShopOffersNewsText(schedule) {

}

function getSalonGuestNewsText(schedule) {

}

function getPairChangesNewsText(schedule) {

}

function getLoginBonusNewsText(schedule) {

}

function downloadData() {
    let version = versions.find(v => v.version === versionSelect.value);
    if(version === undefined)
        return;

    let newsText = "";
    let startDate = new Date(`${startDateInput.value}T06:00:00Z`);
    let endDate = new Date(`${endDateInput.value}T05:59:59Z`);

    // -------- INTRODUCTION -------- //
    newsText += "[h2]Programme[/h2]\n" +
        "Cet article liste les évènements de Pokémon Masters EX annoncés officiellement pour cette semaine. " +
        "Nous le complèterons au fur et à mesure des annonces ou de l'arrivée des évènements en jeu jusqu'au " +
        `${getDayMonthDate(endDate)}.\n\n` +
        "Cliquez sur les dates en rouge dans le calendrier ci-dessous pour accéder rapidement au contenu prévu. " +
        `Les débuts d'évènements se font à ` +
        `${startDate.toLocaleTimeString('fr-fr', {hour: 'numeric', minute: '2-digit'}).replace(":", "h")} ` +
        `et les fins à ` +
        `${endDate.toLocaleTimeString('fr-fr', {hour: 'numeric', minute: '2-digit'}).replace(":", "h")} ` +
        `aux dates indiquées.\n\n`;

    startDate.setHours(0, 0, 0);
    endDate.setHours(23, 59, 59);

    let schedule = version.schedule.sort().filter(sched => sched.startDate*1000 >= startDate.getTime() && sched.startDate*1000 <= endDate.getTime());
    let startDates = [...new Set(schedule.map(s => s.startDate))]
        .sort()
        .map(t => new Date(t*1000));

    // -------- CALENDRIER -------- //
    newsText += "[listh]\n";

    let date = getMonday(startDates[0]);
    let lastPrintMonth = -1;

    do {
        if(lastPrintMonth !== date.getMonth()) {
            if(lastPrintMonth !== -1) {
                newsText += "[/table][/item]\n\n";
            }

            let monthName = date.toLocaleString("default", {month: 'long'});
            monthName = monthName.replace(/^./, monthName[0].toUpperCase());

            newsText += "[item|nostyle][table]\n" +
                `\t[tr][th|colspan=7]${monthName}[/th][/tr]\n` +
                "\t[tr][th]Lun.[/th][th]Mar.[/th][th]Mer.[/th][th]Jeu.[/th][th]Ven.[/th][th]Sam.[/th][th]Dim.[/th][/tr]\n";

            lastPrintMonth = date.getMonth();
        }

        newsText += "\t[tr|color=grey]";

        for(let i = 0; i < 7; i++) {
            newsText += "[td]";

            if(date.getMonth() === lastPrintMonth && (date.getDay()+6)%7 === i) {

                if(startDates.map(sd => sd.getTime()).includes(date.getTime())) {
                    newsText += `[b][url=#${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}]` +
                        `${date.getDate().toString()}[/url][/b]`;
                }
                else {
                    newsText += `${date.getDate().toString()}`;
                }
                date.setDate(date.getDate() + 1);
            }
            else {
                newsText += " ";
            }

            newsText += "[/td]";
        }

        newsText += "[/tr]\n";

    } while(date <= endDate);

    // -------- DIAMANTS RESTANTS -------- //
    newsText += "[/table][/item]\n" +
        "[/listh]\n\n" +
        "[h2]Diamants encore obtenables[/h2]\n" +
        "Le tableau ci-dessous indique les Diamants encore obtenables des évènements et autres offres déjà sorties.\n\n" +
        "[listh]\n" +
        "[item|nostyle|width=400px][table]\n" +
        "[tr][th]Période[/th][th]Évènements[/th][th|colspan=3]Diamants[/th][/tr]\n" +
        "[tr][td]JJ/MM[br]JJ/MM[/td][td]<\NOM>[/td][td]1234[/td][/tr]\n" +
        "[/table][/item]\n" +
        "[/listh]\n\n";

    // -------- ÉVÉNEMENTS ET SCOUTS -------- //

    startDates.forEach(timestamp => {
        treatedEvents = [];

        let date = new Date(timestamp);

        newsText += `[ancre=${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}][h2]${getDayMonthDate(date)}[/h2]\n`;

        schedule.filter(s => s.startDate*1000 === timestamp.getTime()).forEach(sched => {

            switch(sched.scheduleType.name) {
                case "scout":

                    newsText += getScoutNewsText(sched);
                    break;

                case "event":
                    if(sched.isLegendaryBattle) {
                        getLegBatNewsText(sched);
                        break;
                    }

                    if(sched.isHomeAppeal) {
                        getHomeAppealEventNewsText(sched)
                        break;
                    }

                    getEventNewsText(sched);
                    break;

                case "shop":
                    getShopOffersNewsText(sched);
                    break;

                case "salon":
                    getSalonGuestNewsText(sched);
                    break;

                case "chara":
                    getPairChangesNewsText(sched);
                    break;

                case "loginBonus":
                    getLoginBonusNewsText(sched);
                    break;
            }
        });
    });

    // -------- FOOTER -------- //
    newsText += `\n\n` +
        `[h2]Liens utiles[/h2]\n` +
        `[b][>>] [url=/page/jeuxvideo/pokemon-masters/accueil]Dossier Pokémon Masters EX[/url][/b]\n` +
        `[b][>>] [url=/page/jeuxvideo/pokemon-masters/archive-events]Archive des événements[/url][/b]\n\n` +
        `[color=grey]Sources : Annonces officielles et datamine de Pokémon Masters EX\n` +
        `Discord et Reddit : r/PokemonMasters\n` +
        `Twitter : Absol-utely (@absolutelypm)[/color]`

    console.log(newsText);
}

function scheduleByVersion() {
    while(versionSelect.length > 0) {
        versionSelect.remove(0);
    }

    for(let i = 0; i < versions.length; i++) {
        versions[i].schedule = schedule.filter(s =>
                s.startDate >= versions[i].releaseTimestamp
                && (i === 0 || s.startDate < versions[i-1].releaseTimestamp)
            )
            .map(s => {
                s.isLegendaryBattle = false;
                s.isHomeAppeal = false;

                if(scoutIds.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "scout", "priority": "10" };
                }
                else if(salonGuestsUpdate.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "salon", "priority": "30" };
                }
                else if(s.scheduleId.startsWith("chara_")) {
                    s.scheduleType = { "name" : "chara", "priority": "40" };
                }
                else if(s.scheduleId.endsWith("_Shop_otoku")) {
                    s.scheduleType = { "name" : "shop", "priority": "50" };
                }
                else if(s.scheduleId.endsWith("_musiccoin_FOREVER")) {
                    s.scheduleType = { "name" : "music", "priority": "60" };
                }
                else if(loginBonusIds.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "loginBonus", "priority": "70" };
                }
                else {
                    s.scheduleType = { "name" : "event", "priority": "20" };

                    if(legendaryBattleIds.includes(s.scheduleId)) {
                        s.isLegendaryBattle = true;
                    }
                    if(trainingAreaUpdate.includes(s.scheduleId) || mainStoryUpdate.includes(s.scheduleId)) {
                        s.isHomeAppeal = true;
                    }
                }
                return s;
            })
            .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.scheduleType.priority.localeCompare(b.scheduleType.priority));

        let date = new Date(versions[i].releaseTimestamp*1000);

        let option = {};
        option.value = versions[i].version;
        option.text = `Version ${versions[i].version} (${date.toLocaleDateString('fr-fr', {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }
}

function printEndDate(timestamp) {
    let endDate = timestamp === '32503680000' ? "Permanent" : new Intl.DateTimeFormat('fr-FR', {dateStyle: 'full', timeStyle: 'short'}).format(new Date(timestamp*1000-1));
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

async function printPairChanges(scheduleId) {

    // Ajout de cases dans le plateau
    let panelChanges = [...new Set(abilityPanel.filter(ap => ap.scheduleId === scheduleId).map(ap => ap.trainerId))].map(tid => { return {"trainerId" : tid, "type": "panel", "text" : "Ajout de cases dans le plateau duo-gemme."}; });

    // Sortie de duo
    let trainerRelease = [...new Set(trainer.filter(ti => ti.scheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "add", "text" : "Ajout du duo dans le jeu."}; });

    // Sortie du 6EX
    let trainerExRelease = [...new Set(trainer.filter(ti => ti.exScheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "ex", "text" : "Ajout du 6★ EX."}; });

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

function printNewMusics(scheduleId) {
    let itemIds = itemExchange.filter(ie => ie.scheduleId === scheduleId).map(ie => ie.itemId);

    scheduleDiv.innerHTML += "<b>Ajout de musiques dans le Jukebox :</b>";
    scheduleDiv.innerHTML += "<ul>";

    itemIds.forEach(itemId => {
        scheduleDiv.innerHTML += `<li>${jukeboxMusicName[itemId]}</li>`;
    });

    scheduleDiv.innerHTML += "</ul>";
}

function printLoginBonus(loginBonus) {

    if(loginBonus.bannerId > -1) {
        let lbBanner = banner.filter(b => b.bannerId === loginBonus.bannerId);

        lbBanner.forEach(ban => printEventBanner(ban, loginBonus));
    }

    else {
        let entryStr = `<h3>`;

        switch (loginBonus.type) {
            // General Log-In Bonus
            case 0:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || "Bonus de connexion standard";
                entryStr += "</h3>\n";
                entryStr += "Réinitialisation du bonus de connexion normal.\n";
                break;

            // Other Log-In Bonus
            case 1:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || "Bonus de connexion spécial";
                entryStr += "</h3>\n";
                entryStr += "Autre bonus de connexion, non-identifié.\n";
                break;

            // Compensation
            case 2:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || "Compensation";
                entryStr += "</h3>\n";
                entryStr += "Compensation pour un problème.\n";
                break;

            // Bonus Retour
            case 3:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || "Bonus Retour";
                entryStr += "</h3>\n";
                entryStr += "Campagne de retour.\n";
                break;

            // Packs Diamants Journaliers
            case 4:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || "Pack de Diamants journaliers";
                entryStr += "</h3>\n";
                entryStr += "Pack de diamants journaliers.\n";
                break;

            // Journée Pokémon Masters
            case 5:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || "Bonus de connexion JPM";
                entryStr += "</h3>\n";
                entryStr += "Bonus de connexion pour la Journée Pokémon Masters.\n";
                break;
        }

        scheduleDiv.innerHTML += entryStr;
        printEndDate(loginBonus.endDate);
    }

    // scheduleDiv.innerHTML += "<br><br><b>RÉCOMPENSES:</b>";
    // loginBonusReward.filter(lbr => lbr.rewardId === loginBonus.rewardId).sort((a, b) => a.day - b.day).forEach(lbr => {
    //     scheduleDiv.innerHTML += `<br><b>Jour ${lbr.day}:</b> `;
    //     let sets = itemSet.filter(is => is.itemSetId === lbr.itemSetId)[0];
    //     let i = 1;
    //     while(sets[`item${i}`] && sets[`item${i}`] !== "0") {
    //         scheduleDiv.innerHTML += `${sets[`item${i}`]} x${sets[`item${i}Quantity`]}`;
    //         i++;
    //     }
    // });
}

function printCalendars(startDates) {

    let date = getMonday(startDates[0]);
    let endDate = startDates[startDates.length-1];
    let lastPrintMonth = -1;
    let calendarDiv = document.getElementById("calendar");
    calendarDiv.innerHTML = "";
    const today = new Date();

    if(isAdminMode) {
        const startDateString = `${startDates[0].getFullYear()}-${(startDates[0].getMonth()+1).toString().padStart(2, '0')}-${startDates[0].getDate().toString().padStart(2, '0')}`;
        const endDateString = `${endDate.getFullYear()}-${(endDate.getMonth()+1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

        startDateInput.setAttribute("value", startDateString);
        startDateInput.setAttribute("min", startDateString);
        startDateInput.setAttribute("max", endDateString);

        endDateInput.setAttribute("value", endDateString);
        endDateInput.setAttribute("min", startDateString);
        endDateInput.setAttribute("max", endDateString);
    }

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

                if(today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
                    calDay.classList.add("calToday");
                }

                if(startDates.map(sd => getYMDDate(sd)).includes(getYMDDate(date))) {
                    let link = document.createElement("a");
                    link.href = `#${getYMDDate(date)}`;
                    link.innerHTML = `<b>${date.getDate().toString()}</b>`;

                    calDay.classList.add("calClick");
                    calDay.onclick = () => link.click();
                    calDay.appendChild(link);

                    if(nextContentBtn.getAttribute("href") === "#" && today < date) {
                        nextContentBtn.href = `#${getYMDDate(date)}`;
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

    } while(date.getMonth() <= endDate.getMonth() && date.getFullYear() <= endDate.getFullYear());
}

function setVersionInfos(id) {
    let version = versions.find(v => v.version === id);

    if(version === undefined)
        return;

    scheduleDiv.innerHTML = "";

    let scoutFlag, eventFlag, shopFlag, salonFlag, charaFlag, musicFlag, loginBonusFlag;
    let startDates = [...new Set(version.schedule.map(s => s.startDate))].sort();

    printCalendars(startDates.map(t => new Date(t*1000)));

    startDates.forEach(timestamp => {

        scoutFlag = eventFlag = shopFlag = salonFlag = charaFlag = musicFlag = loginBonusFlag = true;
        treatedEvents = [];

        let date = new Date(timestamp*1000);
        scheduleDiv.innerHTML += `<h1 id="${getYMDDate(date)}" style="margin-top: 50px; scroll-margin-top: 2.8em">${new Intl.DateTimeFormat('fr-FR', {dateStyle: 'full', timeStyle: 'short'}).format(date)}</h1>\n`;

        version.schedule.filter(schedule => schedule.startDate === timestamp).forEach(sched => {
            switch(sched.scheduleType.name) {
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
                    break;

                case "music":
                    if(musicFlag) {
                        scheduleDiv.innerHTML += "<h2>Jukebox</h2>";
                        musicFlag = false;
                    }
                    printNewMusics(sched.scheduleId);
                    break;

                case "loginBonus":
                    if(loginBonusFlag) {
                        scheduleDiv.innerHTML += "<h2>Bonus de connexion</h2>";
                        loginBonusFlag = false;
                    }
                    printLoginBonus(sched);
                    break;
            }
        });
    });
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;
    nextContentBtn.href = "#"
    nextContentBtn.style.display = "none";

    setVersionInfos(id);

    if(setUrl)
        setUrlEventID(versionSelect.value);

    if(window.location.hash !== "" && window.location.hash !== "#") {
        setTimeout(function () {
            let tmp = document.createElement("a");
            tmp.href = window.location.hash;
            tmp.click();
        }, 1000);
    }
}

function setUrlEventID(id) {
    const url = new URL(window.location);
    url.searchParams.set('version', id);

    window.history.pushState(null, '', url.toString());
}

async function init() {
    versionSelect = document.getElementById("versionSelect");
    scheduleDiv = document.getElementById("scheduleDiv");
    toolsDiv = document.getElementById('adminTools');

    await getData();
    await getCustomJSON();

    if(isAdminMode) {
        toolsDiv.style.display = "table";

        startDateInput = document.getElementById("startDate");
        endDateInput = document.getElementById("endDate");

        downloadButton = document.getElementById("downloadData");
        downloadButton.onclick = downloadData;
    }

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

    //downloadData()

    // const leftSchedule = schedule
    //     .filter(s => s.startDate >= versions[0].releaseTimestamp && !versions[0].schedule.includes(s))
    //     .sort((a, b) => a.startDate.localeCompare(b.startDate));
    // console.log(leftSchedule);
}

scrollTopBtn.addEventListener('click', () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
});

init();
