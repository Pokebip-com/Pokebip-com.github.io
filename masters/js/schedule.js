let abilityPanel;
let banner;
let championBattleRegion;
let championBattleRegionOpeningSchedule;
let eventBannerList;
let eventQuestGroup;
let itemExchange;
let homeEventAppeal;
let legendQuestGroup;
let legendQuestGroupSchedule;
let missionGroup;

let schedule;
let scoutIds;
let championBattleAllPeriod;
let cyclicRankingIds;
let eventIds;
let loginBonusIds;
let legendaryBattleIds;
let missionGroupIds;
let salonGuestsUpdate;
let mainStoryUpdate;
let trainingAreaUpdate;
let trainerRarityupBonusUpdate;

let cyclicRankingEvent;
let cyclicRankingQuestGroup;
let cyclicRankingQuestGroupSchedule;

let scout;
let scoutPickup;
let storyQuest;

let shopPurchasableItem;
let shopTierPrices;

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
let trainerNames;
let trainerRarityupBonus;
let trainerVerboseNames;

let schedLocales;


let cyclicRankingData;
let treatedEvents;

let scheduleDiv;
let versionSelect;
let toolsDiv;
let startDateInput;
let endDateInput;
let downloadAll;

const scrollTopBtn = document.getElementById('scrollTop');
const nextContentBtn = document.getElementById('nextContent');

const salonBannerPath = `./data/banner/event/update_4090_0W_Regular_01.png`;

// Textes des bannières du Combat de Maître Spécial
const CBEText1Id = 17503026;
const CBEText2Id = 27503027;

async function getData() {
    abilityPanel = await jsonCache.getProto("AbilityPanel");

    banner = await jsonCache.getProto("Banner");

    eventQuestGroup = await jsonCache.getProto("EventQuestGroup");

    // On ne prend que les missions qui ne sont pas des missions d'événement
    missionGroup = (await jsonCache.getProto("MissionGroup")).filter(mg => eventQuestGroup.filter(eqg => eqg.bannerId === mg.bannerId).length === 0);

    eventQuestGroup.push(...(await jsonCache.getProto("VillaQuestGroup")).map(vqg => vqg.bannerId = 1202001));

    let champBattleEvent = await jsonCache.getProto("ChampionBattleEvent");
    let champBattleEventQuestGroup = await jsonCache.getProto("ChampionBattleEventQuestGroup");

    champBattleEventQuestGroup.map(cbeqg => {
        cbeqg.bannerId = champBattleEvent.find(cbe => cbe.championBattleEventId === cbeqg.championBattleEventId).bannerId;

        banner.map(ban => {
            if(ban.bannerId === cbeqg.bannerId) {
                if(ban.text1Id == -1)
                    ban.text1Id = CBEText1Id;

                if(ban.text2Id == -1)
                    ban.text2Id = CBEText2Id;
            }
        });
    });
    eventQuestGroup.push(...champBattleEventQuestGroup);

    championBattleRegion = await jsonCache.getProto("ChampionBattleRegion");
    championBattleRegionOpeningSchedule = await jsonCache.getProto("ChampionBattleRegionOpeningSchedule");

    eventQuestGroup.push(...await jsonCache.getProto("ChallengeToStrongTrainerQuestGroup"));

    cyclicRankingEvent = await jsonCache.getProto("CyclicRankingEvent");
    cyclicRankingQuestGroup = await jsonCache.getProto("CyclicRankingQuestGroup");
    cyclicRankingQuestGroupSchedule = await jsonCache.getProto("CyclicRankingQuestGroupSchedule");
    cyclicRankingData = getBySpecificID(cyclicRankingQuestGroupSchedule, "scheduleId");

    scout = await jsonCache.getProto("Scout");

    scoutPickup = await jsonCache.getProto("ScoutPickup");
    storyQuest = await jsonCache.getProto("StoryQuest");

    salonGuests = await jsonCache.getProto("SalonGuest");

    legendQuestGroup = getBySpecificID(await jsonCache.getProto("LegendQuestGroup"), "questGroupId");
    legendQuestGroupSchedule = getBySpecificID(await jsonCache.getProto("LegendQuestGroupSchedule"), "scheduleId");

    trainerRarityupBonus = await jsonCache.getProto("TrainerRarityupBonus");

    schedule = await jsonCache.getProto("Schedule");
    getSchedule();

    bannerText = await jsonCache.getLsd("banner_text");
    eventBannerList = await jsonCache.getProto("EventBanner");
    eventName = await jsonCache.getLsd("event_name");

    itemExchange = await jsonCache.getProto("ItemExchange");

    const lastScheduleStartDate = Math.max(...new Set(schedule.map(s => s.startDate*1)));

    loginBonus = (await jsonCache.getProto("LoginBonus")).filter(lb => lb.startDate <= lastScheduleStartDate).map(lb => {
        lb.scheduleId = lb.loginBonusId;
        lb.startDate = lb.startDate.toString();
        lb.endDate = lb.endDate.toString();
        return lb;
    });

    loginBonusIds = loginBonus.map(lb => lb.loginBonusId);

    loginBonusName = await jsonCache.getLsd("login_bonus_name");

    schedule.push(...loginBonus);

    shopPurchasableItem = await jsonCache.getProto("ShopPurchasableItem");

    loginBonusReward = await jsonCache.getProto("LoginBonusReward");

    jukeboxMusicName = await jsonCache.getLsd("jukebox_music_name");

    homeEventAppeal = await jsonCache.getProto("HomeEventAppeal");

    scoutPickupDescr = await jsonCache.getLsd("scout_pickup_description");

    monster = await jsonCache.getProto("Monster");
    monsterBase = await jsonCache.getProto("MonsterBase");

    trainer = await jsonCache.getProto("Trainer");
    trainerBase = await jsonCache.getProto("TrainerBase");
    trainerExRole = await jsonCache.getProto("TrainerExRole");

    motifTypeName = await jsonCache.getLsd("motif_type_name");

    monsterNames = await jsonCache.getLsd("monster_name");
    trainerNames = await jsonCache.getLsd("trainer_name");
    trainerVerboseNames = await jsonCache.getLsd("trainer_verbose_name");

    itemSet = await jsonCache.getProto("ItemSet");
}

async function getCustomJSON() {
    schedLocales = await jsonCache.getLocale("schedule");
    shopTierPrices = (await jsonCache.getCustom("shop_tier_prices", true));
    versions = await jsonCache.getCustom("version_release_dates").then(orderByVersion);
}

function getSchedule() {

    scoutIds = scout.map(s => s.scheduleId);
    eventIds = [...new Set(storyQuest.filter(sq => !sq.scheduleId.includes("_ChampionBattle_")).map(sq => sq.scheduleId))];
    legendaryBattleIds = [...new Set(Object.keys(legendQuestGroupSchedule))];
    salonGuestsUpdate = [...new Set(salonGuests.map(sg => sg.scheduleId))];
    mainStoryUpdate = [...new Set(storyQuest.filter(sq => sq.questType === "MainStory").map(sq => sq.scheduleId))];
    trainingAreaUpdate = [...new Set(storyQuest.filter(sq => sq.questType === 8).map(sq => sq.scheduleId))];
    championBattleAllPeriod = [...new Set(schedule.filter(s => s.scheduleId.endsWith("ChampionBattle_AllPeriod")))];
    trainerRarityupBonusUpdate = [...new Set(trainerRarityupBonus.map(trb => trb.scheduleId))];
    cyclicRankingIds = [...new Set(cyclicRankingQuestGroupSchedule.map(crqg => crqg.scheduleId))];
    missionGroupIds = [...new Set(missionGroup.map(mg => mg.scheduleId))];


    let usableSchedule = schedule.filter(s =>
        scoutIds.includes(s.scheduleId)
        || cyclicRankingIds.includes(s.scheduleId)
        || eventIds.includes(s.scheduleId)
        || legendaryBattleIds.includes(s.scheduleId)
        || missionGroupIds.includes(s.scheduleId)
        || mainStoryUpdate.includes(s.scheduleId)
        || trainingAreaUpdate.includes(s.scheduleId)
        || trainerRarityupBonusUpdate.includes(s.scheduleId)
        || salonGuestsUpdate.includes(s.scheduleId)
        || s.scheduleId.startsWith("chara_")
        || s.scheduleId.includes("_Shop_otoku")
        || s.scheduleId.endsWith("_musiccoin_FOREVER")
        || (s.scheduleId.includes("_ChampionBattle_")
            && !(s.scheduleId.endsWith("_AllPeriod")
                || s.scheduleId.endsWith("_Emblem")
                || s.scheduleId.endsWith("FOREVER")
                || s.scheduleId.endsWith("_option")
            ))
    );

    // console.log(schedule.entries.filter(s => s.startDate >= versions[0].releaseTimestamp && !usableSchedule.includes(s.scheduleId)));

    schedule = usableSchedule;
}

function getBySpecificID(data, id) {
    return data.reduce(function (r, a) {
        r[a[id]] = r[a[id]] || [];
        r[a[id]].push(a);
        return r;
    }, {});
}



async function getScoutNewsText(schedule) {
    let scheduleScouts = scout.filter(sc => sc.scheduleId === schedule.scheduleId);

    if (scheduleScouts.length === 0)
        return;

    let newsText = "";

    for (const schedScout of scheduleScouts) {
        let scoutBanners = banner.filter(b => b.bannerId === schedScout.bannerId);

        scoutBanners.forEach(sb => {
            newsText += `[h3]${bannerText[sb.text1Id].replaceAll("\n", " ")}`;

            if (sb.text2Id > -1) {
                newsText += ` ${bannerText[sb.text2Id].replaceAll("\n", " ")}`;
            }

            newsText += "[/h3]\n\n";
        });

        newsText += "[center][img]-[/img][/center]\n\n";

        let sPickups = scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);

        if (sPickups.length > 0) {
            newsText += "[listh]\n" +
                "[item|nostyle][table]\n" +
                "\t[tr][th|colspan=3]Duos à l'affiche[/th][th]Rôles[/th][th]Type[/th][th]Potentiel[/th][th]Plateau[/th][/tr]\n";

            for (const sp of sPickups) {
                newsText += "\t[tr]\n" +
                    `\t\t[td]${(getTrainerNumber(sp.trainerId))}[/td]\n` +
                    `\t\t[td][url=/page/jeuxvideo/pokemon-masters/duos/LIEN-DU-DUO]` +
                    `[img|w=80]/pages/jeuxvideo/pokemon-masters/images/personnages/bustes/PERSO.png[/img]\n` +
                    `\t\t[b]${(getTrainerName(sp.trainerId).replaceAll("\n", "[br]"))}[/b][/url][/td]\n` +
                    `\t\t[td]` +
                    `[img|w=80]/pages/icones/poke/MX/NUMERO.png[/img]\n` +
                    `\t\t[b]${await getMonsterNameByTrainerId(sp.trainerId)}[/b][/td]\n` +
                    `\t\t[td][type=${removeAccents((await getRoleByTrainerId(sp.trainerId)).toLowerCase()).replace(" ", "-")}|MX]`;

                let exRole = await getExRoleText(sp.trainerId);

                if (exRole !== null) {
                    newsText += `[br][type=${removeAccents(exRole.toLowerCase())}-ex|MX]`;
                }

                newsText += `[/td]\n` +
                    `\t\t[td][type=${removeAccents(await getTrainerTypeName(sp.trainerId).toLowerCase())}|MX][/td]\n` +
                    `\t\t[td]${"★".repeat(await getTrainerRarity(sp.trainerId))}`;

                if ((await hasExUnlocked(sp.trainerId))) {
                    newsText += `[br][type=ex|MX]`;
                }

                newsText += `[/td]\n` +
                    `\t\t[td]${await getAbilityPanelQty(sp.trainerId)} cases[/td]\n` +
                    `\t[/tr]\n`;
            }

            newsText += "[/table][/item]\n\n" +
                "[item|nostyle][table]\n" +
                "\t[tr][th]Fin de l'affiche[/th][/tr]\n" +
                `\t[tr][td]${getDayMonthDate(new Date(schedule.endDate * 1000 - 1))}[/td][/tr]\n` +
                "[/table][/item]\n" +
                "[/listh]\n\n";
        }
    }

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

            let monthName = date.toLocaleString(locale, {month: 'long'});
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

function addCyclingRankingEvents(i, latestCyclicRankingSchedule) {
    let cyclicRankingScheduleStartDates = Object.keys(latestCyclicRankingSchedule).sort((a, b) => a - b);

    if(cyclicRankingScheduleStartDates.length > 0) {
        let firstCRSchedule = 0;

        cyclicRankingScheduleStartDates
            .map(parseInt)
            .filter(sd => sd < versions[i].releaseTimestamp)
            .map(sd => {
                firstCRSchedule = Math.max(firstCRSchedule, sd);
            });

        if(firstCRSchedule === 0) {
            firstCRSchedule = cyclicRankingScheduleStartDates[0];
        }

        let lastCRSchedule = 0;

        cyclicRankingScheduleStartDates
            .map(parseInt)
            .filter(sd => sd >= versions[i].releaseTimestamp && (i === 0 || sd < versions[i-1].releaseTimestamp))
            .map(sd => {
                lastCRSchedule = Math.max(lastCRSchedule, sd);
            });

        if(lastCRSchedule === 0) {
            lastCRSchedule = cyclicRankingScheduleStartDates[cyclicRankingScheduleStartDates.length - 1];
        }

        let startDates = [...new Set(cyclicRankingScheduleStartDates.filter(sd => sd >= firstCRSchedule && sd <= lastCRSchedule))];
        let sdPointer = -1;
        let sdSelect = startDates[0];

        let cyclicRankingQuestGroupId, cyclingSeconds;
        let lastStart = versions[i].schedule.map(s => s.startDate).sort((a, b) => b - a)[0];

        let j = 0;

        while(latestCyclicRankingSchedule[sdSelect].startDate <= lastStart) {
            if(sdPointer === -1 || (sdPointer + 1) < startDates.length && startDates[sdPointer + 1] >= latestCyclicRankingSchedule.startDate) {
                sdPointer++;
                sdSelect = startDates[sdPointer];
                cyclicRankingQuestGroupId = cyclicRankingData[latestCyclicRankingSchedule[sdSelect].scheduleId][0].questGroupId;
                cyclingSeconds = cyclicRankingEvent.filter(ce => ce.damageChallengeBattleId === cyclicRankingQuestGroupId)[0].secondsBeforeCycling;
            }

            let schedule = {...latestCyclicRankingSchedule[sdSelect]};
            schedule.cyclingSeconds = [...cyclingSeconds]

            let idx = latestCyclicRankingSchedule[sdSelect].cycleIdx;

            versions[i].schedule.push(schedule);

            latestCyclicRankingSchedule[sdSelect].startDate = "" + (parseInt(cyclingSeconds[idx]) + parseInt(latestCyclicRankingSchedule[sdSelect].startDate));
            latestCyclicRankingSchedule[sdSelect].cycleIdx = (idx+1) % cyclingSeconds.length;
        }
    }
}

function scheduleByVersion() {
    while(versionSelect.length > 0) {
        versionSelect.remove(0);
    }

    let latestCyclicRankingSchedule = {};

    for(let i = versions.length - 2; i >= 0; i--) {
        versions[i].schedule = schedule.filter(s =>
                s.startDate >= versions[i].releaseTimestamp
                && (i === 0 || s.startDate < versions[i-1].releaseTimestamp)
            )
            .map(s => {
                s.isLegendaryBattle = false;
                s.isHomeAppeal = false;
                s.isCyclicRanking = false;

                if(scoutIds.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "scout", "priority": "10" };
                }
                else if(salonGuestsUpdate.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "salon", "priority": "30" };
                }
                else if(s.scheduleId.startsWith("chara_")) {
                    s.scheduleType = { "name" : "chara", "priority": "40" };
                }
                else if(s.scheduleId.includes("_Shop_otoku")) {
                    s.scheduleType = { "name" : "shop", "priority": "50" };
                }
                else if(s.scheduleId.endsWith("_musiccoin_FOREVER")) {
                    s.scheduleType = { "name" : "music", "priority": "60" };
                }
                else if(loginBonusIds.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "loginBonus", "priority": "70" };
                }
                else if(s.scheduleId.includes("_ChampionBattle_")) {
                    s.scheduleType = { "name" : "championBattle", "priority": "17" };
                }
                else if(missionGroupIds.includes(s.scheduleId)) {
                    s.scheduleType = { "name" : "mission", "priority": "25" };
                }
                else {
                    s.scheduleType = { "name" : "event", "priority": "20" };

                    if(legendaryBattleIds.includes(s.scheduleId)) {
                        s.isLegendaryBattle = true;
                    }
                    if(trainingAreaUpdate.includes(s.scheduleId) || mainStoryUpdate.includes(s.scheduleId)) {
                        s.isHomeAppeal = true;
                    }
                    if(Object.keys(cyclicRankingData).includes(s.scheduleId)) {
                        s.isCyclicRanking = true;
                        latestCyclicRankingSchedule[s.startDate] = {...s};
                        latestCyclicRankingSchedule[s.startDate].originalSD = s.startDate;
                        latestCyclicRankingSchedule[s.startDate].questGroupId = cyclicRankingData[s.scheduleId][0].questGroupId;
                        latestCyclicRankingSchedule[s.startDate].cycleIdx = 0;
                    }
                }
                return s;
            });

        addCyclingRankingEvents(i, latestCyclicRankingSchedule);

        versions[i].schedule
            .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.scheduleType.priority.localeCompare(b.scheduleType.priority));
    }

    for(let i = 0; i < versions.length - 1; i++) {
        let date = new Date(versions[i].releaseTimestamp*1000);

        let option = {};
        option.value = versions[i].version;
        option.text = `Version ${versions[i].version} (${date.toLocaleDateString(locale, {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }
}

function printEndDate(timestamp) {
    let endDate = timestamp === '32503680000' ? schedLocales.duration_permanent : new Intl.DateTimeFormat(locale, {dateStyle: 'full', timeStyle: 'short'}).format(new Date(timestamp*1000-1));
    scheduleDiv.innerHTML += `<br /><br /><strong>${schedLocales.end_date} </strong> ${endDate}`;
}

async function printScouts(schedule) {
    let scheduleScouts = scout.filter(sc => sc.scheduleId === schedule.scheduleId);

    if (scheduleScouts.length === 0)
        return;

    for (const schedScout of scheduleScouts) {
        let scoutBanners = banner.filter(b => b.bannerId === schedScout.bannerId);

        scoutBanners.forEach(sb => {
            let h3 = `<h3>${bannerText[sb.text1Id]}`;

            if (sb.text2Id > -1) {
                h3 += ` ${bannerText[sb.text2Id]}`;
            }

            h3 += "</h3>";

            scheduleDiv.innerHTML += h3;

            if (sb.bannerIdString !== "") {
                scheduleDiv.innerHTML += `<img src="./data/banner/scout/${sb.bannerIdString}.png" class="bannerImg" />\n`;
            }
        });

        printEndDate(schedule.endDate);

        let sPickups = scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);

        if (sPickups.length > 0) {
            scheduleDiv.innerHTML += `<br /><br /><b>${schedLocales.featured_sync_pairs}</b>\n`;

            let ul = `<ul style='list-style-type: disc;'>\n`;

            for (const sp of sPickups) {
                ul += `<li><b>${await getPairPrettyPrintWithUrl(sp.trainerId)}</b></li>\n`;
            }

            ul += "</ul>\n";
            scheduleDiv.innerHTML += ul;
        }
    }
}

function printShopBanner(banner, schedule) {
    let h3 = `<h3>${bannerText[banner.text1Id]}`;

    if(banner.text2Id > -1) {
        h3 += ` ${bannerText[banner.text2Id]}`;
    }

    h3 += "</h3>";

    scheduleDiv.innerHTML += h3;

    if(banner.bannerIdString !== "") {
        scheduleDiv.innerHTML += `<img src="./data/banner/event/${banner.bannerIdString}.png" class="bannerImg" />\n`;
    }

    let purchasableItems = shopPurchasableItem.filter(spi => spi.scheduleId === schedule.scheduleId);

    if(purchasableItems.length > 0) {

        scheduleDiv.innerHTML += `<br /><br /><b>${schedLocales.gem_packs}</b>\n`;

        let ul = `<ul>\n`;

        purchasableItems.forEach(pi => {
            let matches = pi.internalName.match(/paidvc_[a-zA-Z]+([0-9]+)_([0-9]+)/i);
            let price = shopTierPrices.find(stp => stp.tier.toString() === matches[1]);

            price = price.euros || "??.??";

            ul += `<li><b>${matches[2]} ${schedLocales.gems}</b> ${price}€ (${pi.limit}x)</li>\n`;
        });

        ul += `</ul>`;

        scheduleDiv.innerHTML += ul;
    }

    printEndDate(schedule.endDate);
}

function printEventBanner(eventBanner, lastSchedule) {
    let h3 = `<h3>${bannerText[eventBanner.text1Id]}`;

    if(eventBanner.text2Id > -1) {
        h3 += ` ${bannerText[eventBanner.text2Id]}`;
    }

    h3 += "</h3>";

    scheduleDiv.innerHTML += h3;

    if(eventBanner.bannerIdString !== "") {
        scheduleDiv.innerHTML += `<img src="./data/banner/event/${eventBanner.bannerIdString}.png" class="bannerImg" />\n`;
    }

    printEndDate(lastSchedule.endDate);
}

function printEvents(sched) {
    let scheduleQuests = storyQuest.filter(quest => quest.scheduleId === sched.scheduleId);

    if(scheduleQuests.length === 0)
        return;

    let questGroups = [...new Set(scheduleQuests.map(sq => sq.questGroupId))];

    questGroups.forEach(qg => {

        if(treatedEvents.includes(qg)) {
            return;
        }
        else {
            treatedEvents.push(qg);

            let scheduleIds = [...new Set(storyQuest.filter(sq => sq.questGroupId === qg).map(sq => sq.scheduleId))];

            if(scheduleIds.length > 1) {
                sched = schedule.find(s => s.scheduleId === scheduleIds[scheduleIds.length - 1]);
            }
        }

        eventQuestGroup.filter(eventQG => eventQG.questGroupId == qg)
            .forEach(eventQG => {
                let eventBanners = banner.filter(b => b.bannerId === eventQG.bannerId);

                eventBanners.forEach(eb => printEventBanner(eb, sched));
            });
    });
}

async function printPairChanges(sched) {

    const scheduleId = sched.scheduleId;

    // Ajout de cases dans le plateau
    let panelChanges = [...new Set(abilityPanel.filter(ap => ap.scheduleId === scheduleId).map(ap => ap.trainerId))].map(tid => { return {"trainerId" : tid, "type": "panel", "text" : schedLocales.grid_additions}; });

    // Sortie de duo
    let trainerRelease = [...new Set(trainer.filter(ti => ti.scheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "add", "text" : schedLocales.pair_addition}; });

    // Sortie du 6EX
    let trainerExRelease = [...new Set(trainer.filter(ti => ti.exScheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "ex", "text" : schedLocales.ex_addition}; });

    // Musique offerte au 6EX
    const musicReleases = schedule.filter(s => trainerRarityupBonusUpdate.includes(s.scheduleId) && s.startDate === sched.startDate);
    let trainerExMusicRelease = [...new Set(trainerRarityupBonus.filter(trb => musicReleases.map(mr => mr.scheduleId).includes(trb.scheduleId)).map(trb => {
        let itSet = itemSet.find(is => is.itemSetId === trb.itemSetId);
        if(!itSet)
            return null;

        let music;

        for(let i = 1; i <= 10; i++) {
            if(itSet[`item${i}`] === "0" || itSet[`item${i}Quantity`] === 0)
                continue;

            music = jukeboxMusicName[itSet[`item${i}`]];
            break;
        }
        return { "trainerId" : trb.trainerId, "type" : "exMusic", "text" : `${schedLocales.ex_music} <i>${music}</i>.` };
    }))];

    // Sortie du Rôle EX
    let ExRoleRelease = [...new Set(trainerExRole.filter(ti => ti.scheduleId === scheduleId).map(ti => { return {"trainerId" : ti.trainerId, "role" : commonLocales.role_names[ti.role] }; }))].map(exRole => { return {"trainerId" : exRole.trainerId, "type" : "exRole", "text" : schedLocales.ex_role_release.replace("{{role}}", exRole.role)}; });

    let changes = trainerRelease.concat(trainerExRelease, trainerExMusicRelease, ExRoleRelease, panelChanges).sort(async (a, b) => (await getTrainerName(a.trainerId)).localeCompare(await getTrainerName(b.trainerId)));

    let lastTID = "";

    if(changes.length === 0){
        scheduleDiv.innerHTML += schedLocales.misc_pair_addition;
    }

    scheduleDiv.innerHTML += "<ul>";

    for(let index in changes) {
        if(lastTID !== changes[index].trainerId) {
            if(lastTID !== "") {
                scheduleDiv.innerHTML += "<br />";
            }

            lastTID = changes[index].trainerId;

        }

        scheduleDiv.innerHTML += `<li><b>${await getPairPrettyPrintWithUrl(changes[index].trainerId)} : </b> ${changes[index].text}</li>`;
    }

    scheduleDiv.innerHTML += "</ul>";
}

async function printSalonGuest(scheduleId) {
    let salonGuestList = [...new Set(salonGuests.filter(sg => sg.scheduleId === scheduleId).map(sg => sg.trainerId))].map(tid => {
        return {"trainerId": tid, "type": "add", "text": schedLocales.lodge_addition};
    });

    let lastTID = "";

    scheduleDiv.innerHTML += "<ul>";

    for (let index in salonGuestList) {
        if (lastTID !== salonGuestList[index].trainerId) {
            if (lastTID !== "") {
                scheduleDiv.innerHTML += "<br />";
            }

            lastTID = salonGuestList[index].trainerId;

        }

        scheduleDiv.innerHTML += `<li><b>${await getPairPrettyPrintWithUrl(salonGuestList[index].trainerId)} : </b> ${salonGuestList[index].text}</li>`;
    }
}

function printShopOffers(schedule) {
    let eventBanners = eventBannerList.filter(eb => eb.scheduleId === schedule.scheduleId);

    console.log(schedule);

    if(eventBanners.length === 0)
        return;

    eventBanners.forEach(eb => {
        let banners = banner.filter(b => b.bannerId === eb.bannerId);

        banners.forEach(ban => printShopBanner(ban, schedule));
    });
}

function printChampionBattle(sched) {
    let period = championBattleAllPeriod.find(cbap => sched.startDate >= cbap.startDate && sched.startDate < cbap.endDate);
    let openingSchedule = championBattleRegionOpeningSchedule.find(cbros => cbros.scheduleId === period.scheduleId);
    let cbr = championBattleRegion.find(cbr => cbr.championBattleRegionId === openingSchedule.championBattleId);
    let ban = banner.find(b => b.bannerId === cbr.bannerId);

    printEventBanner(ban, sched);
}

function printHomeAppealEvent(schedule) {
    const eventAppeal = homeEventAppeal.filter(hea => hea.bannerScheduleId === schedule.scheduleId);

    eventAppeal.forEach(ea => {
        let banners = banner.filter(b => b.bannerId === ea.bannerId);

        banners.forEach(ban => printEventBanner(ban, schedule));
    })
}

function printCyclicRanking(schedule) {
    let secondsPassed = parseInt(schedule.startDate) - parseInt(schedule.originalSD);
    let CRQuests = cyclicRankingQuestGroup.filter(crqg => crqg.questGroupId === schedule.questGroupId);
    let CRQNum = 0;

    for(let i = 0; secondsPassed > 0; i++) {
        secondsPassed -= schedule.cyclingSeconds[i % schedule.cyclingSeconds.length];
        CRQNum++;
    }

    CRQNum = CRQNum % (CRQuests.length) + 1;

    let quest = CRQuests.find(crq => crq.cyclicRankingQuestNum === CRQNum);
    let banners = banner.filter(b => b.bannerId === quest.bannerId);
    banners.forEach(ban => printEventBanner(ban, schedule));
}

function printLegBat(schedule) {
    let banners = banner.filter(b => b.bannerId === legendQuestGroup[legendQuestGroupSchedule[schedule.scheduleId][0].questGroupId][0].bannerId);
    banners.forEach(ban => printEventBanner(ban, schedule));
}

function printNewMissions(schedule) {
    let miGr = missionGroup.filter(mg => mg.scheduleId === schedule.scheduleId);
    miGr.forEach(mg => {
        let banners = banner.filter(b => b.bannerId === mg.bannerId);
        banners.forEach(ban => printEventBanner(ban, schedule));
    });
}

function printNewMusics(scheduleId) {
    let itemIds = itemExchange.filter(ie => ie.scheduleId === scheduleId).map(ie => ie.itemId);

    scheduleDiv.innerHTML += `<b>${schedLocales.jukebox_music}</b>`;

    let ul = `<ul>\n`;

    itemIds.forEach(itemId => {
        ul += `<li>${jukeboxMusicName[itemId]}</li>\n`;
    });

    ul += "</ul>";
    scheduleDiv.innerHTML += ul;
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
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || schedLocales.standard_login_bonus;
                entryStr += "</h3>\n";
                entryStr += `${schedLocales.standard_login_bonus_reset}\n`;
                break;

            // Other Log-In Bonus
            case 1:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || schedLocales.special_login_bonus;
                entryStr += "</h3>\n";
                entryStr += `${schedLocales.unknown_bonus}\n`;
                break;

            // Compensation/Cadeau de Rallye
            case 2:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || schedLocales.gift_compensation;
                entryStr += "</h3>\n";
                entryStr += `${schedLocales.gift_compensation_descr}\n`;
                break;

            // Bonus Retour
            case 3:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || schedLocales.welcome_back_rally;
                entryStr += "</h3>\n";
                entryStr += `${schedLocales.welcome_back_rally_descr}\n`;
                break;

            // Packs Diamants Journaliers
            case 4:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || schedLocales.daily_gem_packs;
                entryStr += "</h3>\n";
                entryStr += `${schedLocales.daily_gem_packs}\n`;
                break;

            // Journée Pokémon Masters
            case 5:
                entryStr += loginBonusName[loginBonus.loginBonusNameId] || schedLocales.pmd_login_bonus;
                entryStr += "</h3>\n";
                entryStr += `${schedLocales.pmd_login_bonus_descr}\n`;
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

            calThMonth.innerText = date.toLocaleString(locale, {month: 'long'});
            calThMonth.innerText = calThMonth.innerText.replace(/^./, calThMonth.innerText[0].toUpperCase());
            calThMonth.colSpan = 7;

            calTrMonth.appendChild(calThMonth);
            calThead.appendChild(calTrMonth);

            let calTrDays = document.createElement("tr");

            let calThMon = document.createElement("th");
            calThMon.innerText = schedLocales.cal_monday;
            calTrDays.appendChild(calThMon);

            let calThTue = document.createElement("th");
            calThTue.innerText = schedLocales.cal_tuesday;
            calTrDays.appendChild(calThTue);

            let calThWed = document.createElement("th");
            calThWed.innerText = schedLocales.cal_wednesday;
            calTrDays.appendChild(calThWed);

            let calThThu = document.createElement("th");
            calThThu.innerText = schedLocales.cal_thursday;
            calTrDays.appendChild(calThThu);

            let calThFri = document.createElement("th");
            calThFri.innerText = schedLocales.cal_friday;
            calTrDays.appendChild(calThFri);

            let calThSat = document.createElement("th");
            calThSat.innerText = schedLocales.cal_saturday;
            calTrDays.appendChild(calThSat);

            let calThSun = document.createElement("th");
            calThSun.innerText = schedLocales.cal_sunday;
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

async function setVersionInfos(id) {
    let version = versions.find(v => v.version === id);

    if (version === undefined)
        return;

    scheduleDiv.innerHTML = "";

    let scoutFlag, eventFlag, shopFlag, salonFlag, charaFlag, musicFlag, loginBonusFlag, championBattleFlag,
        missionFlag;
    let startDates = [...new Set(version.schedule.map(s => s.startDate))].sort();

    printCalendars(startDates.map(t => new Date(t * 1000)));

    for (const timestamp of startDates) {

        scoutFlag = eventFlag = shopFlag = salonFlag = charaFlag = musicFlag = loginBonusFlag = championBattleFlag = missionFlag = true;
        treatedEvents = [];

        let date = new Date(timestamp * 1000);
        scheduleDiv.innerHTML += `<h1 id="${getYMDDate(date)}" style="margin-top: 50px; scroll-margin-top: 2.8em">${new Intl.DateTimeFormat(locale, {
            dateStyle: 'full',
            timeStyle: 'short'
        }).format(date)}</h1>\n`;

        for (const sched of version.schedule.filter(schedule => schedule.startDate === timestamp)) {
            switch (sched.scheduleType.name) {
                case "scout":
                    if (scoutFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.scouts}</h2>`;
                        scoutFlag = false;
                    }
                    await printScouts(sched);
                    break;

                case "championBattle":
                    if (championBattleFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.champion_stadium}</h2>`;
                        championBattleFlag = false;
                    }
                    printChampionBattle(sched);
                    break;

                case "event":
                    if (eventFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.events}</h2>`;
                        eventFlag = false;
                    }

                    if (sched.isLegendaryBattle) {
                        printLegBat(sched);
                        break;
                    }

                    if (sched.isHomeAppeal) {
                        printHomeAppealEvent(sched);
                        break;
                    }

                    if (sched.isCyclicRanking) {
                        if (sched.originalSD) {
                            printCyclicRanking(sched);
                        }
                        break;
                    }

                    printEvents(sched);
                    break;

                case "shop":
                    if (shopFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.gem_specials}</h2>`;
                        shopFlag = false;
                    }
                    printShopOffers(sched);
                    break;

                case "salon":
                    if (salonFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.trainer_lodge}</h2>`;
                        scheduleDiv.innerHTML += `<img src="${salonBannerPath}" class="bannerImg" />`;
                        salonFlag = false;
                    }
                    await printSalonGuest(sched.scheduleId);
                    break;

                case "chara":
                    if (charaFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.pair_addition_update}</h2>`;
                        charaFlag = false;
                    }
                    await printPairChanges(sched);
                    break;

                case "mission":
                    if (missionFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.mission}</h2>`;
                        missionFlag = false;
                    }
                    printNewMissions(sched);
                    break;

                case "music":
                    if (musicFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.jukebox}</h2>`;
                        musicFlag = false;
                    }
                    printNewMusics(sched.scheduleId);
                    break;

                case "loginBonus":
                    if (loginBonusFlag) {
                        scheduleDiv.innerHTML += `<h2>${schedLocales.login_bonus}</h2>`;
                        loginBonusFlag = false;
                    }
                    printLoginBonus(sched);
                    break;
            }
        }
    }
}

async function setVersion(id, setUrl = true) {
    versionSelect.value = id;
    nextContentBtn.href = "#"
    nextContentBtn.style.display = "none";

    await setVersionInfos(id);

    if (setUrl)
        setUrlEventID(versionSelect.value);

    if (window.location.hash !== "" && window.location.hash !== "#") {
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

function changeHtmlTexts() {
    versionSelect = document.createElement("select");
    versionSelect.id = "versionSelect";

    document.getElementById("verSelDiv").appendChild(versionSelect);
    document.getElementById("changeVersion").innerText = schedLocales.change_version;
    document.getElementById("downloadDataLegend").innerText = schedLocales.download_data_legend;
    document.getElementById("downloadData").innerText = schedLocales.download_data_btn;
    document.getElementById("calendarTitle").innerText = schedLocales.calendar_title;
}

async function init() {

    versionSelect = document.getElementById("versionSelect");
    scheduleDiv = document.getElementById("scheduleDiv");
    toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await getCustomJSON();
    await getData().then();
    changeHtmlTexts();

    if(isAdminMode) {
        toolsDiv.style.display = "table";

        startDateInput = document.getElementById("startDate");
        endDateInput = document.getElementById("endDate");

        downloadAll = document.getElementById("downloadData");
        downloadAll.onclick = downloadData;
    }

    scheduleByVersion();


    versionSelect.onchange = async function() {
        await setVersion(versionSelect.value);
    };

    const url = new URL(window.location);
    const urlVersionId = url.searchParams.get('version');

    if(urlVersionId !== null) {
        versionSelect.value = urlVersionId;
    }

    await setVersion(versionSelect.value, false);

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
