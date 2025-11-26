let championBattleAllPeriod;
let cyclicRankingIds;
let eventIds;
let loginBonusIds;
let legendaryBattleIds;
let mainStoryUpdate;
let missionGroupIds;
let salonGuestsUpdate;
let scoutIds;
let shopPurchasableIds;
let trainingAreaUpdate;
let trainerRarityupBonusUpdate;

let treatedEvents;
let scoutQty, cbQty, eventQty, shopQty, salonQty, charaQty, missionQty, musicQty, loginBonusQty;

let scheduleDiv;
let versionSelect;
let toolsDiv;
let startDateInput;
let endDateInput;
let downloadAll;

let latestCyclicRankingSchedule = {};

const scrollTopBtn = document.getElementById('scrollTop');
const nextContentBtn = document.getElementById('nextContent');

const salonBannerPath = `./data/banner/event/update_4090_0W_Regular_01.png`;
const gymStartScheduleId = "7010_1W_Gym_start";

// Textes des bannières du Combat de Maître Spécial
const CBEText1Id = 17503026;
const CBEText2Id = 27503027;

async function getData() {
    // LOCALES
    jsonCache.preloadLocale("schedule");

    // PROTO
    jsonCache.preloadProto("AbilityPanel");
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("ChallengeToStrongTrainerQuestGroup");
    jsonCache.preloadProto("ChampionBattleEvent");
    jsonCache.preloadProto("ChampionBattleEventQuestGroup");
    jsonCache.preloadProto("ChampionBattleRegion");
    jsonCache.preloadProto("ChampionBattleRegionOpeningSchedule");
    jsonCache.preloadProto("CyclicRankingEvent");
    jsonCache.preloadProto("CyclicRankingQuestGroup");
    jsonCache.preloadProto("CyclicRankingQuestGroupSchedule");
    jsonCache.preloadProto("EventBanner");
    jsonCache.preloadProto("EventQuestGroup");
    jsonCache.preloadProto("HomeEventAppeal");
    jsonCache.preloadProto("ItemExchange");
    jsonCache.preloadProto("ItemSet");
    jsonCache.preloadProto("LegendQuestGroup");
    jsonCache.preloadProto("LegendQuestGroupSchedule");
    jsonCache.preloadProto("LoginBonus");
    jsonCache.preloadProto("LoginBonusMonthlyElement");
    jsonCache.preloadProto("LoginBonusMonthlyReward");
    jsonCache.preloadProto("LoginBonusReward");
    jsonCache.preloadProto("MissionGroup");
    jsonCache.preloadProto("Monster");
    jsonCache.preloadProto("MonsterBase");
    jsonCache.preloadProto("SalonGuest");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("Scout");
    jsonCache.preloadProto("ScoutEp");
    jsonCache.preloadProto("ScoutPickup");
    jsonCache.preloadProto("ShopPurchasableItem");
    jsonCache.preloadProto("StoryQuest");
    jsonCache.preloadProto("Trainer");
    jsonCache.preloadProto("TrainerBase");
    jsonCache.preloadProto("TrainerExRole");
    jsonCache.preloadProto("TrainerRarityupBonus");
    jsonCache.preloadProto("VillaQuestGroup");

    // LSD
    jsonCache.preloadLsd("banner_text");
    jsonCache.preloadLsd("event_name");
    jsonCache.preloadLsd("jukebox_music_name");
    jsonCache.preloadLsd("login_bonus_name");
    jsonCache.preloadLsd("monster_name");
    jsonCache.preloadLsd("motif_type_name");
    jsonCache.preloadLsd("scout_pickup_description");
    jsonCache.preloadLsd("trainer_name");
    jsonCache.preloadLsd("trainer_verbose_name");

    // CUSTOM
    jsonCache.preloadCustom("version_release_dates");
    jsonCache.preloadCustom("shop_tier_prices");

    // Utils files
    preloadUtils(true);

    await jsonCache.runPreload().then(() => processData());
}

function processData() {
    // On ne prend que les missions qui ne sont pas des missions d'événement
    jData.proto.missionGroup = jData.proto.missionGroup
        .filter(mg =>
            jData.proto.eventQuestGroup.filter(eqg => eqg.bannerId === mg.bannerId).length === 0
            && mg.bannerId > 0
        );

    jData.proto.championBattleEventQuestGroup.map(cbeqg => {
        cbeqg.bannerId = jData.proto.championBattleEvent.find(cbe => cbe.championBattleEventId === cbeqg.championBattleEventId).bannerId;

        jData.proto.banner.map(ban => {
            if(ban.bannerId === cbeqg.bannerId) {
                if(ban.text1Id == -1)
                    ban.text1Id = CBEText1Id;

                if(ban.text2Id == -1)
                    ban.text2Id = CBEText2Id;
            }
        });
    });

    jData.proto.cyclicRankingData = getBySpecificID(jData.proto.cyclicRankingQuestGroupSchedule, "scheduleId");
    jData.proto.legendQuestGroup = getBySpecificID(jData.proto.legendQuestGroup, "questGroupId");
    jData.proto.legendQuestGroupSchedule = getBySpecificID(jData.proto.legendQuestGroupSchedule, "scheduleId");

    getSchedule();

    jData.proto.eventQuestGroup.push(...jData.proto.challengeToStrongTrainerQuestGroup);
    jData.proto.eventQuestGroup.push(...jData.proto.championBattleEventQuestGroup);
    jData.proto.eventQuestGroup.push(...jData.proto.villaQuestGroup.map(vqg => vqg.bannerId = 1202001));

    const lastScheduleStartDate = Math.max(...new Set(jData.proto.schedule.map(s => s.startDate*1)));

    jData.proto.loginBonus = jData.proto.loginBonus.filter(lb => lb.startDate <= lastScheduleStartDate).map(lb => {
        lb.scheduleId = lb.loginBonusId;
        lb.startDate = lb.startDate.toString();
        lb.endDate = lb.endDate.toString();
        return lb;
    });

    loginBonusIds = jData.proto.loginBonus.map(lb => lb.loginBonusId);

    jData.proto.trainer = jData.proto.trainer.map(tr => {
        // Dresseurs ajoutés avec la fonctionnalité des arènes
        if(tr.scoutMethod === 4 && tr.scheduleId === "FOREVER") {
            tr.scheduleId = gymStartScheduleId;
        }

        return tr;
    });

    jData.proto.schedule.push(...jData.proto.loginBonus);
}

function getSchedule() {
    scoutIds = jData.proto.scout.map(s => s.scheduleId);
    championBattleAllPeriod = [...new Set(jData.proto.schedule.filter(s => s.scheduleId.endsWith("ChampionBattle_AllPeriod")))];
    cyclicRankingIds = [...new Set(jData.proto.cyclicRankingQuestGroupSchedule.map(crqg => crqg.scheduleId))];
    eventIds = [...new Set(jData.proto.eventQuestGroup.map(eqg => eqg.scheduleId))];
    legendaryBattleIds = [...new Set(Object.keys(jData.proto.legendQuestGroupSchedule))];
    mainStoryUpdate = [...new Set(jData.proto.storyQuest.filter(sq => sq.questType === "MainStory").map(sq => sq.scheduleId))];
    missionGroupIds = [...new Set(jData.proto.missionGroup.map(mg => mg.scheduleId))];
    salonGuestsUpdate = [...new Set(jData.proto.salonGuest.map(sg => sg.scheduleId))];
    shopPurchasableIds = [...new Set(jData.proto.shopPurchasableItem.map(sp => sp.scheduleId))];
    trainingAreaUpdate = [...new Set(jData.proto.storyQuest.filter(sq => sq.questType === "TrainingArea" || sq.questType === "TrainingArea2").map(sq => sq.scheduleId))];
    trainerRarityupBonusUpdate = [...new Set(jData.proto.trainerRarityupBonus.map(trb => trb.scheduleId))];

    let usableSchedule = jData.proto.schedule.filter(s =>
        !s.scheduleId.startsWith("QA_") && (
            s.scheduleId === gymStartScheduleId
            || scoutIds.includes(s.scheduleId)
            || cyclicRankingIds.includes(s.scheduleId)
            || eventIds.includes(s.scheduleId)
            || legendaryBattleIds.includes(s.scheduleId)
            || mainStoryUpdate.includes(s.scheduleId)
            || missionGroupIds.includes(s.scheduleId)
            || salonGuestsUpdate.includes(s.scheduleId)
            || trainingAreaUpdate.includes(s.scheduleId)
            || trainerRarityupBonusUpdate.includes(s.scheduleId)
            || s.scheduleId.startsWith("chara_")
            || (shopPurchasableIds.includes(s.scheduleId) && !s.scheduleId.includes("_gymstamp_"))
            || s.scheduleId.endsWith("_musiccoin_FOREVER")
            || (s.scheduleId.includes("_ChampionBattle_")
                && !(s.scheduleId.endsWith("_AllPeriod")
                    || s.scheduleId.endsWith("_Emblem")
                    || s.scheduleId.endsWith("FOREVER")
                    || s.scheduleId.endsWith("_option")
                ))
            )
    );

    // console.log(jData.proto.schedule.filter(s => s.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp && !usableSchedule.includes(s.scheduleId)));

    jData.proto.schedule = usableSchedule;
}

function getScoutNewsText(schedule) {
    let scheduleScouts = jData.proto.scout.filter(sc => sc.scheduleId === schedule.scheduleId);

    if (scheduleScouts.length === 0)
        return;

    let newsText = "";

    for (const schedScout of scheduleScouts) {
        let scoutBanners = jData.proto.abilityPanel.filter(b => b.bannerId === schedScout.bannerId);

        scoutBanners.forEach(sb => {
            newsText += `[h3]${jData.lsd.bannerText[sb.text1Id].replaceAll("\n", " ")}`;

            if (sb.text2Id > -1) {
                newsText += ` ${jData.lsd.bannerText[sb.text2Id].replaceAll("\n", " ")}`;
            }

            newsText += "[/h3]\n\n";
        });

        newsText += "[center][img]-[/img][/center]\n\n";

        let sPickups = jData.proto.scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);

        if (sPickups.length > 0) {
            newsText += "[listh]\n" +
                "[item|nostyle][table]\n" +
                "\t[tr][th|colspan=3]Duos à l'affiche[/th][th]Rôles[/th][th]Type[/th][th]Potentiel[/th][th]Plateau[/th][/tr]\n";

            for (const sp of sPickups) {
                newsText += "\t[tr]\n" +
                    `\t\t[td]${getTrainerNumber(sp.trainerId)}[/td]\n` +
                    `\t\t[td][url=/page/jeuxvideo/pokemon-masters/duos/LIEN-DU-DUO]` +
                    `[img|w=80]/pages/jeuxvideo/pokemon-masters/images/personnages/bustes/PERSO.png[/img]\n` +
                    `\t\t[b]${((getTrainerName(sp.trainerId)).replaceAll("\n", "[br]"))}[/b][/url][/td]\n` +
                    `\t\t[td]` +
                    `[img|w=80]/pages/icones/poke/MX/NUMERO.png[/img]\n` +
                    `\t\t[b]${getMonsterNameByTrainerId(sp.trainerId)}[/b][/td]\n` +
                    `\t\t[td][type=${removeAccents(getRoleByTrainerId(sp.trainerId).toLowerCase()).replace(" ", "-")}|MX]`;

                let exRole = getExRoleText(sp.trainerId);

                if (exRole !== null) {
                    newsText += `[br][type=${removeAccents(exRole.toLowerCase())}-ex|MX]`;
                }

                newsText += `[/td]\n` +
                    `\t\t[td][type=${removeAccents(getTrainerTypeName(sp.trainerId).toLowerCase())}|MX][/td]\n` +
                    `\t\t[td]${"★".repeat(getTrainerRarity(sp.trainerId))}`;

                if (hasExUnlocked(sp.trainerId)) {
                    newsText += `[br][type=ex|MX]`;
                }

                newsText += `[/td]\n` +
                    `\t\t[td]${getAbilityPanelQty(sp.trainerId)} cases[/td]\n` +
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
    let version = jData.custom.versionReleaseDates.find(v => v.version === versionSelect.value);
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

function getCyclingRankingEvents(i) {
    if(jData.custom.versionReleaseDates[i].hasCyclingRankingEventData) {
        return;
    }

    let cyclicRankingScheduleStartDates = Object.keys(latestCyclicRankingSchedule).sort((a, b) => a - b);

    if (cyclicRankingScheduleStartDates.length <= 0) {
        return;
    }

    let firstCRSchedule = 0;

    cyclicRankingScheduleStartDates
        .map(parseInt)
        .filter(sd => sd < jData.custom.versionReleaseDates[i].releaseTimestamp)
        .map(sd => {
            firstCRSchedule = Math.max(firstCRSchedule, sd);
        });

    if (firstCRSchedule === 0) {
        firstCRSchedule = cyclicRankingScheduleStartDates[0];
    }

    let lastCRSchedule = 0;

    cyclicRankingScheduleStartDates
        .map(parseInt)
        .filter(sd => sd >= jData.custom.versionReleaseDates[i].releaseTimestamp && (i === 0 || sd < jData.custom.versionReleaseDates[i - 1].releaseTimestamp))
        .map(sd => {
            lastCRSchedule = Math.max(lastCRSchedule, sd);
        });

    if (lastCRSchedule === 0) {
        lastCRSchedule = cyclicRankingScheduleStartDates[cyclicRankingScheduleStartDates.length - 1];
    }

    const startDates = [...new Set(cyclicRankingScheduleStartDates.filter(sd => sd >= firstCRSchedule && sd <= lastCRSchedule))];
    let sdSelect = startDates[0];
    let cyclicRankingSchedule = latestCyclicRankingSchedule;
    let cyclicRankingQuestGroupId = jData.proto.cyclicRankingData[cyclicRankingSchedule[sdSelect].scheduleId][0].questGroupId;

    const releaseTimestamp = jData.custom.versionReleaseDates[i].releaseTimestamp + 3600;
    const cyclingSeconds = jData.proto.cyclicRankingEvent.find(ce => ce.damageChallengeBattleId === cyclicRankingQuestGroupId).secondsBeforeCycling;
    const totalCycleDuration = cyclingSeconds.reduce((a, b) => parseInt(a) + parseInt(b));
    const initialTimestamp = parseInt(cyclicRankingSchedule[sdSelect].originalSD);

    // Début effectif de la période de calcul (la plus tardive entre les deux timestamps)
    const periodStart = Math.max(releaseTimestamp, initialTimestamp);
    const periodEnd = parseInt(jData.custom.versionReleaseDates[i].schedule.map(s => s.startDate).sort((a, b) => b - a)[0]);

    // console.log(jData.custom.versionReleaseDates[0].schedule.sort((a, b) => a.startDate - b.startDate));

    // Calcul du temps écoulé depuis le premier événement jusqu'à la période de calcul
    let elapsedTime = periodStart - initialTimestamp;

    // Calcul de la position exacte dans le cycle actuel;
    const timeInCurrentCycle = elapsedTime % totalCycleDuration;

    // Trouver le cycle où commence la période
    let cumulativeTime = 0;
    let cycleIndex = cyclingSeconds.findIndex(duration => {
        cumulativeTime += parseInt(duration);
        return cumulativeTime > timeInCurrentCycle;
    });

    // Calcul du timestamp de début de la première occurrence valide
    const eventStartOffset = cumulativeTime - cyclingSeconds[cycleIndex];
    let eventStart = initialTimestamp + elapsedTime - timeInCurrentCycle + eventStartOffset;

    let currentLevelIndex = Math.floor((eventStart - initialTimestamp) / cyclingSeconds[0]) % jData.proto.cyclicRankingQuestGroup.length;

    let accumulator = [];

    // Générer les occurrences dans la période donnée
    while (eventStart < periodEnd) {
        let eventEnd = eventStart + parseInt(cyclingSeconds[cycleIndex]);

        if(eventStart === periodStart) {
            jData.proto.schedule.filter(s => s.scheduleId === cyclicRankingSchedule[sdSelect].scheduleId).map(schedule => {
                schedule.cyclingSeconds = [...cyclingSeconds];
                schedule.startDate = "" + Math.max(eventStart, periodStart);
                schedule.endDate = "" + eventEnd;
                schedule.cyclicRankingQuestNum = currentLevelIndex+1;
            });
        }
        else if(eventEnd > periodStart && eventStart < periodEnd) {
            let schedule = {...cyclicRankingSchedule[sdSelect]};
            schedule.cyclingSeconds = [...cyclingSeconds];
            schedule.startDate = "" + Math.max(eventStart, periodStart);
            schedule.endDate = "" + eventEnd;
            schedule.cyclicRankingQuestNum = currentLevelIndex+1;

            accumulator.push(schedule);
        }

        // Passer à l'occurrence suivante
        eventStart = eventEnd;
        cycleIndex = (cycleIndex + 1) % cyclingSeconds.length;
        currentLevelIndex = (currentLevelIndex + 1) % jData.proto.cyclicRankingQuestGroup.length;
    }

    return accumulator
}

function scheduleByVersion() {
    while(versionSelect.length > 0) {
        versionSelect.remove(0);
    }

    jData.proto.schedule.filter(s => Object.keys(jData.proto.cyclicRankingData).includes(s.scheduleId))
        .map(s => {
            s.scheduleType = { "name" : "event", "priority": "20" };
            s.isCyclicRanking = true;
            latestCyclicRankingSchedule[s.startDate] = {...s};
            latestCyclicRankingSchedule[s.startDate].originalSD = s.startDate;
            latestCyclicRankingSchedule[s.startDate].questGroupId = jData.proto.cyclicRankingData[s.scheduleId][0].questGroupId;
            latestCyclicRankingSchedule[s.startDate].cycleIdx = 0;
        });

    for(let i = 0; i < jData.custom.versionReleaseDates.length - 1; i++) {
        let date = new Date(jData.custom.versionReleaseDates[i].releaseTimestamp*1000);

        let option = {};
        option.value = jData.custom.versionReleaseDates[i].version;
        option.text = `Version ${jData.custom.versionReleaseDates[i].version} (${date.toLocaleDateString(locale, {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }
}

function getVersionSchedule(versionId) {
    let ver = jData.custom.versionReleaseDates.find(vrd => vrd.version === versionId);

    if(ver.schedule)
        return;

    ver.schedule = [];

    let idx = jData.custom.versionReleaseDates.indexOf(ver);

    ver.schedule = [].concat(jData.proto.schedule.filter(s =>
        s.startDate >= ver.releaseTimestamp && (idx === 0 || s.startDate < jData.custom.versionReleaseDates[idx-1].releaseTimestamp)
    ).map(s => {
        s.isLegendaryBattle = legendaryBattleIds.includes(s.scheduleId);
        s.isHomeAppeal = trainingAreaUpdate.includes(s.scheduleId) || mainStoryUpdate.includes(s.scheduleId);
        s.isCyclicRanking = false;
        s.isScout = scoutIds.includes(s.scheduleId);
        s.isSalon = salonGuestsUpdate.includes(s.scheduleId);
        s.isChara = s.scheduleId.startsWith("chara_") || s.scheduleId === gymStartScheduleId;
        s.isShop = shopPurchasableIds.includes(s.scheduleId); //s.scheduleId.includes("_Shop_");
        s.isMusic = s.scheduleId.endsWith("_musiccoin_FOREVER");
        s.isLoginBonus = loginBonusIds.includes(s.scheduleId);
        s.isChampionBattle = s.scheduleId.includes("_ChampionBattle_");
        s.isMission = missionGroupIds.includes(s.scheduleId);
        s.isEvent = eventIds.includes(s.scheduleId);
        return s;
    }));

    //jData.custom.versionReleaseDates[idx].schedule = ver.schedule;
    jData.custom.versionReleaseDates[idx].schedule.push(...getCyclingRankingEvents(idx));
    jData.custom.versionReleaseDates[idx].hasCyclingRankingEventData = true;
    jData.custom.versionReleaseDates[idx].schedule.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function printEndDate(timestamp, printDiv) {
    let endDate = timestamp === '32503680000' ? jData.locale.schedule.duration_permanent : new Intl.DateTimeFormat(locale, {dateStyle: 'full', timeStyle: 'short'}).format(new Date(timestamp*1000-1));
    printDiv.innerHTML += `<br /><br /><strong>${jData.locale.schedule.end_date} </strong> ${endDate}`;
}

function printScouts(schedule, printDiv) {
    let scheduleScouts = jData.proto.scout.filter(sc => sc.scheduleId === schedule.scheduleId);

    if (scheduleScouts.length === 0)
        return;

    for (const schedScout of scheduleScouts) {
        let scoutBanners = jData.proto.banner.filter(b => b.bannerId === schedScout.bannerId);

        scoutBanners.forEach(sb => {
            let h3 = `<h3>${jData.lsd.bannerText[sb.text1Id]}`;

            if (sb.text2Id > -1) {
                h3 += ` ${jData.lsd.bannerText[sb.text2Id]}`;
            }

            h3 += "</h3>";

            printDiv.innerHTML += h3;

            if (sb.bannerIdString !== "") {
                printDiv.innerHTML += `<img loading="lazy" src="./data/banner/scout/${sb.bannerIdString}.png" onerror="this.src = './data/banner/event/${sb.bannerIdString}.png';" class="bannerImg" />\n`;
            }
        });

        printEndDate(schedule.endDate, printDiv);

        let sPickups = jData.proto.scoutPickup.filter(sp => sp.scoutId === schedScout.scoutId);

        if (sPickups.length > 0) {
            printDiv.innerHTML += `<br /><br /><b>${jData.locale.schedule.featured_sync_pairs}</b>\n`;

            let ul = `<ul style='list-style-type: disc;'>\n`;

            for (const sp of sPickups) {
                ul += `<li><b>${getPairPrettyPrintWithUrl(sp.trainerId)}</b></li>\n`;
            }

            ul += "</ul>\n";
            printDiv.innerHTML += ul;
        }

        let scoutEps = jData.proto.scoutEp.filter(sep => sep.scoutId === schedScout.scoutId && sep.u8 === 1);

        if (scoutEps.length > 0) {
            scoutEps.sort((a, b) => a.scoutEpId.localeCompare(b.scoutEpId));

            let rewards = "";

            for(let j = 0; j < scoutEps.length; j++) {
                let is = jData.proto.itemSet.find(iset => iset.itemSetId === scoutEps[j].itemSetId);

                if(!is)
                    continue;

                let itemsArray = [];

                for(let i = 1; i <= 10; i++) {
                    if(is[`item${i}`] === "0")
                        break;

                    itemsArray.push(getItemName(is[`item${i}`]) + " x" + is[`item${i}Quantity`]);
                }

                rewards += `<br /><b>${j+1}.</b> ${itemsArray.join(" + ")}`;
            }

            if(rewards === "")
                continue;

            printDiv.innerHTML += `<br /><b>${jData.locale.schedule.pair_pull_bonus_gift}</b>\n`;
            printDiv.innerHTML += rewards;
        }
    }

    scoutQty++;
}

function printShopBanner(shopBanner, schedule, printDiv) {
    let h3 = `<h3>${jData.lsd.bannerText[shopBanner.text1Id]}`;

    if(shopBanner.text2Id > -1) {
        h3 += ` ${jData.lsd.bannerText[shopBanner.text2Id]}`;
    }

    h3 += "</h3>";

    printDiv.innerHTML += h3;

    if(shopBanner.bannerIdString !== "") {
        printDiv.innerHTML += `<img src="./data/banner/event/${shopBanner.bannerIdString}.png" onerror="this.src = './data/banner/scout/${shopBanner.bannerIdString}.png';" class="bannerImg" />\n`;
    }

    let purchasableItems = jData.proto.shopPurchasableItem.filter(spi => spi.scheduleId === schedule.scheduleId);

    if(purchasableItems.length > 0) {

        printDiv.innerHTML += `<br /><br /><b>${jData.locale.schedule.gem_packs}</b>\n`;

        let ul = `<ul>\n`;

        purchasableItems.forEach(pi => {
            let additionnalText = "";

            if(pi.itemSetId1 > 0) {
                let is = jData.proto.itemSet.find(is => is.itemSetId === pi.itemSetId1);

                if(is)
                    for(let i = 1; i <= 10; i++) {
                        if(is["item" + i] === "0")
                            continue;

                        if(i > 1)
                            additionnalText += " + ";

                        additionnalText += `${getItemName(is["item" + i])} (x${is["item" + i + "Quantity"]})`;
                    }

                if(additionnalText !== "")
                    additionnalText += " + ";
            }

            let matches = pi.internalName.match(/paidvc_[a-zA-Z]+([0-9]+)_([0-9]+)/i);

            if(!matches[1] || !matches[2]) return;

            let price = jData.custom.shopTierPrices.find(stp => stp.tier.toString() === matches[1]);

            price = price.euros || "??.??";

            ul += `<li><b>${additionnalText}${matches[2]} ${jData.locale.schedule.gems}</b> ${price}€ (${pi.limit}x)</li>\n`;
        });

        ul += `</ul>`;

        printDiv.innerHTML += ul;
    }

    printEndDate(schedule.endDate, printDiv);
}

function printEventBanner(eventBanner, lastSchedule, printDiv) {

    // Événement Spécial - Match Spécial de Passio
    // if(eventBanner.type === 25) {
    //     console.log(eventBanner);
    //     eventBanner.text1Id = eventBanner.text1Id > -1 ? eventBanner.text1Id : 17605019;
    //     eventBanner.text2Id = eventBanner.text2Id > -1 ? eventBanner.text2Id : 27605020;
    // }



    let h3 = `<h3>${jData.lsd.bannerText[eventBanner.text1Id]}`;

    if(eventBanner.text2Id > -1) {
        h3 += ` ${jData.lsd.bannerText[eventBanner.text2Id]}`;
    }

    h3 += "</h3>";

    printDiv.innerHTML += h3;


    if(eventBanner.bannerIdString !== "") {
        printDiv.innerHTML += `<img src="./data/banner/event/${eventBanner.bannerIdString}.png" onerror="this.src = './data/banner/scout/${eventBanner.bannerIdString}.png';" class="bannerImg" />\n`;
    }

    printEndDate(lastSchedule.endDate, printDiv);
}

function printEvents(sched, printDiv) {
    let quests = jData.proto.eventQuestGroup.filter(eqg => eqg.scheduleId === sched.scheduleId);

    if(quests.length === 0)
        return;

    quests.forEach(eqg => {
        let banners = jData.proto.banner.filter(b => b.bannerId === eqg.bannerId);

        banners.forEach(ban => printEventBanner(ban, sched, printDiv));
    });

    eventQty++;
}

function printPairChanges(sched, printDiv) {

    const scheduleId = sched.scheduleId;

    // Ajout de cases dans le plateau
    let panelChanges = [...new Set(jData.proto.abilityPanel.filter(ap => ap.scheduleId === scheduleId).map(ap => ap.trainerId))].map(tid => { return {"trainerId" : tid, "type": "panel", "text" : jData.locale.schedule.grid_additions}; });

    // Sortie de duo
    let trainerRelease = [...new Set(jData.proto.trainer.filter(ti => ti.scheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "add", "text" : jData.locale.schedule.pair_addition}; });

    // Sortie du 6EX
    let trainerExRelease = [...new Set(jData.proto.trainer.filter(ti => ti.exScheduleId === scheduleId).map(ti => ti.trainerId))].map(tid => { return {"trainerId" : tid, "type" : "ex", "text" : jData.locale.schedule.ex_addition}; });

    // Musique offerte au 6EX
    const musicReleases = jData.proto.schedule.filter(s => trainerRarityupBonusUpdate.includes(s.scheduleId) && s.startDate === sched.startDate);
    let trainerExMusicRelease = [...new Set(jData.proto.trainerRarityupBonus.filter(trb => musicReleases.map(mr => mr.scheduleId).includes(trb.scheduleId)).map(trb => {
        let itSet = jData.proto.itemSet.find(is => is.itemSetId === trb.itemSetId);
        if(!itSet)
            return null;

        let music;

        for(let i = 1; i <= 10; i++) {
            if(itSet[`item${i}`] === "0" || itSet[`item${i}Quantity`] === 0)
                continue;

            music = jData.lsd.jukeboxMusicName[itSet[`item${i}`]];
            break;
        }
        return { "trainerId" : trb.trainerId, "type" : "exMusic", "text" : `${jData.locale.schedule.ex_music} <i>${music}</i>.` };
    }))];

    // Sortie du Rôle EX
    let ExRoleRelease = [...new Set(jData.proto.trainerExRole.filter(ti => ti.scheduleId === scheduleId).map(ti => { return {"trainerId" : ti.trainerId, "role" : jData.locale.common.role_names[ti.role] }; }))].map(exRole => { return {"trainerId" : exRole.trainerId, "type" : "exRole", "text" : jData.locale.schedule.ex_role_release.replace("{{role}}", exRole.role)}; });

    let changes = trainerRelease.concat(trainerExRelease, trainerExMusicRelease, ExRoleRelease, panelChanges).sort((a, b) => (getTrainerName(a.trainerId)).localeCompare(getTrainerName(b.trainerId)));

    let lastTID = "";

    if(changes.length === 0){
        return;
    }

    printDiv.innerHTML += "<ul>";

    for(let index in changes) {
        if(lastTID !== changes[index].trainerId) {
            if(lastTID !== "") {
                printDiv.innerHTML += "<br />";
            }

            lastTID = changes[index].trainerId;

        }

        printDiv.innerHTML += `<li><b>${getPairPrettyPrintWithUrl(changes[index].trainerId)} : </b> ${changes[index].text}</li>`;
    }

    printDiv.innerHTML += "</ul>";

    charaQty++;
}

function printSalonGuest(scheduleId, printDiv) {
    let salonGuestList = [...new Set(jData.proto.salonGuest.filter(sg => sg.scheduleId === scheduleId).map(sg => sg.trainerId))].map(tid => {
        return {"trainerId": tid, "type": "add", "text": jData.locale.schedule.lodge_addition};
    });

    if(salonGuestList.length === 0)
        return;

    let lastTID = "";

    printDiv.innerHTML += "<ul>";

    for (let index in salonGuestList) {
        if (lastTID !== salonGuestList[index].trainerId) {
            if (lastTID !== "") {
                printDiv.innerHTML += "<br />";
            }

            lastTID = salonGuestList[index].trainerId;

        }

        printDiv.innerHTML += `<li><b>${getPairPrettyPrintWithUrl(salonGuestList[index].trainerId)} : </b> ${salonGuestList[index].text}</li>`;
    }

    salonQty++;
}

function printShopOffers(schedule, printDiv) {
    let eventBannerIds = jData.proto.eventBanner.filter(eb => eb.scheduleId === schedule.scheduleId).map(eb => eb.bannerId);
    let bannerIds = jData.proto.shopPurchasableItem.filter(spi => spi.scheduleId === schedule.scheduleId && spi.bannerId > 0)
        .map(spi => parseInt(spi.bannerId)).concat(eventBannerIds);

    if(bannerIds.length === 0)
        return;

    bannerIds.forEach(bid => {
        let banners = jData.proto.banner.filter(b => b.bannerId === bid);

        banners.forEach(ban => printShopBanner(ban, schedule, printDiv));
    });

    shopQty++;
}

function printChampionBattle(sched, printDiv) {
    let period = championBattleAllPeriod.find(cbap => sched.startDate >= cbap.startDate && sched.startDate < cbap.endDate);
    let openingSchedule = jData.proto.championBattleRegionOpeningSchedule.find(cbros => cbros.scheduleId === period.scheduleId);
    let cbr = jData.proto.championBattleRegion.find(cbr => cbr.championBattleRegionId === openingSchedule.championBattleRegionId);
    let ban = jData.proto.banner.find(b => b.bannerId === cbr.bannerId);

    if (!ban) {
        return;
    }

    printEventBanner(ban, sched, printDiv);
    cbQty++;
}

function printHomeAppealEvent(schedule, printDiv) {
    const eventAppeal = jData.proto.homeEventAppeal.filter(hea => hea.bannerScheduleId === schedule.scheduleId);

    if (eventAppeal.length === 0)
        return;

    eventAppeal.forEach(ea => {
        let banners = jData.proto.banner.filter(b => b.bannerId === ea.bannerId);

        banners.forEach(ban => printEventBanner(ban, schedule, printDiv));
    });

    eventQty++;
}

function printCyclicRanking(schedule, printDiv) {
    let secondsPassed = parseInt(schedule.startDate) - parseInt(schedule.originalSD);
    let CRQuests = jData.proto.cyclicRankingQuestGroup.filter(crqg => crqg.questGroupId === schedule.questGroupId);
    let CRQNum = 0;

    for(let i = 0; secondsPassed > 0; i++) {
        secondsPassed -= schedule.cyclingSeconds[i % schedule.cyclingSeconds.length];
        CRQNum++;
    }

    CRQNum = CRQNum % (CRQuests.length) + 1;

    let quest = CRQuests.find(crq => crq.cyclicRankingQuestNum === CRQNum);
    let banners = jData.proto.banner.filter(b => b.bannerId === quest.bannerId);

    if(banners.length === 0)
        return;

    banners.forEach(ban => printEventBanner(ban, schedule, printDiv));

    eventQty++;
}

function printLegBat(schedule, printDiv) {
    let banners = jData.proto.banner.filter(b => b.bannerId === jData.proto.legendQuestGroup[jData.proto.legendQuestGroupSchedule[schedule.scheduleId][0].questGroupId][0].bannerId);

    if (banners.length === 0)
        return;

    banners.forEach(ban => printEventBanner(ban, schedule, printDiv));

    eventQty++;
}

function printNewMissions(schedule, printDiv) {
    let miGr = jData.proto.missionGroup.filter(mg => mg.scheduleId === schedule.scheduleId);

    if (miGr.length === 0) {
        return;
    }

    miGr.forEach(mg => {
        let banners = jData.proto.banner.filter(b => b.bannerId === mg.bannerId);
        banners.forEach(ban => printEventBanner(ban, schedule, printDiv));
    });

    missionQty++;
}

function printNewMusics(scheduleId, printDiv) {
    let itemIds = jData.proto.itemExchange.filter(ie => ie.scheduleId === scheduleId).map(ie => ie.itemId);

    if (itemIds.length === 0)
        return;

    printDiv.innerHTML += `<b>${jData.locale.schedule.jukebox_music}</b>`;

    let ul = `<ul>\n`;

    itemIds.forEach(itemId => {
        ul += `<li>${jData.lsd.jukeboxMusicName[itemId]}</li>\n`;
    });

    ul += "</ul>";
    printDiv.innerHTML += ul;

    musicQty++;
}

const toDate = (timestamp) => new Date(timestamp * 1000);
const isLeapYear = (year) => (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);

function printLoginBonus(loginBonus, printDiv) {


    if (loginBonus.bannerId > -1) {
        let lbBanner = jData.proto.banner.filter(b => b.bannerId === loginBonus.bannerId);

        if (lbBanner.length === 0) {
            return;
        }

        lbBanner.forEach(ban => printEventBanner(ban, loginBonus, printDiv));
    } else {
        let entryStr = `<h3>`;

        switch (loginBonus.type) {
            // General Log-In Bonus
            case 0:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.standard_login_bonus;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.standard_login_bonus_reset}\n`;
                break;

            // Other Log-In Bonus
            case 1:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.special_login_bonus;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.unknown_bonus}\n`;
                break;

            // Compensation/Cadeau de Rallye
            case 2:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.gift_compensation;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.gift_compensation_descr}\n`;
                break;

            // Bonus Retour
            case 3:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.welcome_back_rally;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.welcome_back_rally_descr}\n`;
                break;

            // Packs Diamants Journaliers
            case 4:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.daily_gem_packs;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.daily_gem_packs}\n`;
                break;

            // Journée Pokémon Masters
            case 5:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.pmd_login_bonus;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.pmd_login_bonus_descr}\n`;
                break;

            // Bonus mensuel
            case 7:
                entryStr += jData.lsd.loginBonusName[loginBonus.loginBonusNameId] || jData.locale.schedule.unknown_bonus;
                entryStr += "</h3>\n";
                entryStr += `${jData.locale.schedule.unknown_bonus}\n`;
                break;
        }

        printDiv.innerHTML += entryStr;
        printEndDate(loginBonus.endDate, printDiv);
    }

    let rewards;

    if(loginBonus.type === 7) {
        let date = toDate(loginBonus.startDate);
        let month = date.getUTCMonth();

        let rewardId;
        if(month.toString() === jData.proto.loginBonusMonthlyElement[0].leapYearIdx && isLeapYear(date.getUTCFullYear())) {
            rewardId = jData.proto.loginBonusMonthlyElement[0].leapYearMonthlyRewardId;
        }
        else {
            rewardId = jData.proto.loginBonusMonthlyElement[0].monthlyRewardId[month];
        }

        rewards = jData.proto.loginBonusMonthlyReward.filter(lbmr => lbmr.rewardId === rewardId).sort((a, b) => a.day - b.day);
    }
    else {
        rewards = jData.proto.loginBonusReward.filter(lbr => lbr.rewardId === loginBonus.rewardId).sort((a, b) => a.day - b.day);
    }

    if(rewards.length === 0) return;

    printDiv.innerHTML += `<br><br><b>${jData.locale.schedule.login_bonus_rewards}</b>`;
    for (const lbr1 of rewards) {
        printDiv.innerHTML += `<br><b>${lbr1.day}.</b>`;
        let sets = jData.proto.itemSet.find(is => is.itemSetId === lbr1.itemSetId);
        let i = 1;
        while (sets[`item${i}`] && sets[`item${i}`] !== "0") {
            printDiv.innerHTML += ` ${getItemName(sets[`item${i}`])} x${sets[`item${i}Quantity`]}`;
            i++;
        }
    }

    loginBonusQty++;
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
            calThMon.innerText = jData.locale.schedule.cal_monday;
            calTrDays.appendChild(calThMon);

            let calThTue = document.createElement("th");
            calThTue.innerText = jData.locale.schedule.cal_tuesday;
            calTrDays.appendChild(calThTue);

            let calThWed = document.createElement("th");
            calThWed.innerText = jData.locale.schedule.cal_wednesday;
            calTrDays.appendChild(calThWed);

            let calThThu = document.createElement("th");
            calThThu.innerText = jData.locale.schedule.cal_thursday;
            calTrDays.appendChild(calThThu);

            let calThFri = document.createElement("th");
            calThFri.innerText = jData.locale.schedule.cal_friday;
            calTrDays.appendChild(calThFri);

            let calThSat = document.createElement("th");
            calThSat.innerText = jData.locale.schedule.cal_saturday;
            calTrDays.appendChild(calThSat);

            let calThSun = document.createElement("th");
            calThSun.innerText = jData.locale.schedule.cal_sunday;
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
                calDay.id = `calDay${getYMDDate(date)}`;

                if(today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
                    calDay.classList.add("calToday");
                }

                calDay.innerText = date.getDate().toString();
                date.setDate(date.getDate() + 1);
            }

            calDaysTr.appendChild(calDay);
        }

        calTable.appendChild(calDaysTr);

    } while(date <= endDate && (date.getMonth() <= endDate.getMonth() || date.getFullYear() <= endDate.getFullYear()));
}

function setVersionInfos(id) {
    let version = jData.custom.versionReleaseDates.find(v => v.version === id);

    if (version === undefined)
        return;

    scheduleDiv.innerHTML = "";

    let dayFlag, scoutFlag, eventFlag, shopFlag, salonFlag, charaFlag, musicFlag, loginBonusFlag, championBattleFlag,
        missionFlag;

    let startDates = [...new Set(version.schedule.map(s => s.startDate))].sort();

    let dayDiv, scoutDiv, eventDiv, shopDiv, salonDiv, charaDiv, musicDiv, loginBonusDiv, championBattleDiv, missionDiv;

    printCalendars(startDates.map(t => new Date(t * 1000)));

    for (const timestamp of startDates) {

        dayFlag = scoutFlag = eventFlag = shopFlag = salonFlag = charaFlag = musicFlag = loginBonusFlag = championBattleFlag = missionFlag = true;
        treatedEvents = [];

        let date = new Date(timestamp * 1000);
        // scheduleDiv.innerHTML += `<h1 id="${getYMDDate(date)}" style="margin-top: 50px; scroll-margin-top: 2.8em">${new Intl.DateTimeFormat(locale, {
        //     dateStyle: 'full',
        //     timeStyle: 'short'
        // }).format(date)}</h1>\n`;

        dayDiv = document.createElement("div");
        scoutDiv = document.createElement("div");
        championBattleDiv = document.createElement("div");
        eventDiv = document.createElement("div");
        shopDiv = document.createElement("div");
        salonDiv = document.createElement("div");
        charaDiv = document.createElement("div");
        missionDiv = document.createElement("div");
        musicDiv = document.createElement("div");
        loginBonusDiv = document.createElement("div");

        scoutQty = cbQty = eventQty = shopQty = salonQty = charaQty = missionQty = musicQty = loginBonusQty = 0;

        for (const sched of version.schedule.filter(schedule => schedule.startDate === timestamp)) {

            if(dayFlag) {
                dayFlag = false;
                dayDiv.innerHTML = `<h1 id="${getYMDDate(date)}" style="margin-top: 50px; scroll-margin-top: 2.8em">${new Intl.DateTimeFormat(locale, {
                    dateStyle: 'full',
                    timeStyle: 'short'
                }).format(date)}</h1>\n`
            }

            if(sched.isScout) {
                if (scoutFlag) {
                    scoutFlag = false;
                    scoutDiv.innerHTML = `<h2>${jData.locale.schedule.scouts}</h2>`;
                }
                printScouts(sched, scoutDiv);
            }

            if(sched.isChampionBattle) {
                if (championBattleFlag) {
                    championBattleFlag = false;
                    championBattleDiv.innerHTML = `<h2>${jData.locale.schedule.champion_stadium}</h2>`;
                }
                printChampionBattle(sched, championBattleDiv);
            }

            if(sched.isEvent || sched.isLegendaryBattle || sched.isHomeAppeal || sched.isCyclicRanking) {
                if (eventFlag) {
                    eventFlag = false;
                    eventDiv.innerHTML = `<h2>${jData.locale.schedule.events}</h2>`;
                }

                if (sched.isLegendaryBattle) {
                    printLegBat(sched, eventDiv);
                }

                else if (sched.isHomeAppeal) {
                    printHomeAppealEvent(sched, eventDiv);
                }

                else if (sched.isCyclicRanking && sched.originalSD) {
                    printCyclicRanking(sched, eventDiv);
                }

                else {
                    printEvents(sched, eventDiv);
                }
            }

            if(sched.isShop && jData.proto.shopPurchasableItem.filter(spi => spi.scheduleId === sched.scheduleId && spi.refreshInterval !== "Monthly").length > 0) {
                if (shopFlag) {
                    shopFlag = false;
                    shopDiv.innerHTML = `<h2>${jData.locale.schedule.gem_specials}</h2>`;
                }
                printShopOffers(sched, shopDiv);
            }

            if(sched.isSalon) {
                if (salonFlag) {
                    salonFlag = false;
                    salonDiv.innerHTML = `<h2>${jData.locale.schedule.trainer_lodge}</h2>\n<img src="${salonBannerPath}" class="bannerImg" />`;
                }
                printSalonGuest(sched.scheduleId, salonDiv);
            }

            if(sched.isChara) {
                if (charaFlag) {
                    charaFlag = false;
                    charaDiv.innerHTML = `<h2>${jData.locale.schedule.pair_addition_update}</h2>`;
                }
                printPairChanges(sched, charaDiv);
            }

            if(sched.isMission) {
                if (missionFlag) {
                    missionFlag = false;
                    missionDiv.innerHTML = `<h2>${jData.locale.schedule.mission}</h2>`;
                }
                printNewMissions(sched, missionDiv);
            }

            if(sched.isMusic) {
                if (musicFlag) {
                    musicFlag = false;
                    musicDiv.innerHTML = `<h2>${jData.locale.schedule.jukebox}</h2>`;
                }
                printNewMusics(sched.scheduleId, musicDiv);
            }

            if(sched.isLoginBonus) {
                if (loginBonusFlag) {
                    loginBonusFlag = false;
                    loginBonusDiv.innerHTML = `<h2>${jData.locale.schedule.login_bonus}</h2>`;
                }
                printLoginBonus(sched, loginBonusDiv);
            }
        }

        if(scoutQty > 0)
            dayDiv.appendChild(scoutDiv);
        if(cbQty > 0)
            dayDiv.appendChild(championBattleDiv);
        if(eventQty > 0)
            dayDiv.appendChild(eventDiv);
        if(shopQty > 0)
            dayDiv.appendChild(shopDiv);
        if(salonQty > 0)
            dayDiv.appendChild(salonDiv);
        if(charaQty > 0)
            dayDiv.appendChild(charaDiv);
        if(missionQty > 0)
            dayDiv.appendChild(missionDiv);
        if(musicQty > 0)
            dayDiv.appendChild(musicDiv);
        if(loginBonusQty > 0)
            dayDiv.appendChild(loginBonusDiv);

        if(scoutQty + cbQty + eventQty + shopQty + salonQty + charaQty + missionQty + musicQty + loginBonusQty > 0) {
            scheduleDiv.appendChild(dayDiv);

            let date = new Date(timestamp*1000);
            let today = new Date();
            let YMDDate = getYMDDate(date);

            let calDay = document.getElementById(`calDay${YMDDate}`);

            let link = document.createElement("a");
            link.href = `#${YMDDate}`;
            link.innerHTML = `<b>${date.getDate().toString()}</b>`;

            calDay.innerHTML = "";
            calDay.classList.add("calClick");
            calDay.onclick = () => link.click();
            calDay.appendChild(link);

            if(nextContentBtn.getAttribute("href") === "#" && today < date) {
                nextContentBtn.href = `#${YMDDate}`;
                nextContentBtn.style.display = "inline-flex";
            }
        }
    }
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;
    nextContentBtn.href = "#"
    nextContentBtn.style.display = "none";

    getVersionSchedule(id);

    setVersionInfos(id);

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
    document.getElementById("changeVersion").innerText = jData.locale.schedule.change_version;
    document.getElementById("downloadDataLegend").innerText = jData.locale.schedule.download_data_legend;
    document.getElementById("downloadData").innerText = jData.locale.schedule.download_data_btn;
    document.getElementById("calendarTitle").innerText = jData.locale.schedule.calendar_title;
}

async function init() {

    versionSelect = document.getElementById("versionSelect");
    scheduleDiv = document.getElementById("scheduleDiv");
    toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await getData();

    changeHtmlTexts();

    if(isAdminMode) {
        toolsDiv.style.display = "table";

        startDateInput = document.getElementById("startDate");
        endDateInput = document.getElementById("endDate");

        downloadAll = document.getElementById("downloadData");
        downloadAll.onclick = downloadData;
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

    setVersion(versionSelect.value, false);

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
