let championBattleAllPeriod;
let cyclicRankingIds;
let eventIds;
let loginBonusIds;
let legendaryBattleIds;
let missionGroupIds;
let mainStoryUpdate;
let trainingAreaUpdate;

let gemsCountDiv, versionSelect;
let latestCyclicRankingSchedule = {};

// Textes des bannières du Combat de Maître Spécial
const CBEText1Id = 17503026;
const CBEText2Id = 27503027;

const gemsItemId = "410000000001";

let lastScheduleStartDate;

let totalGemsCount = 0;


async function getData() {
    // PROTO
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("ChallengeToStrongTrainerQuestGroup");
    jsonCache.preloadProto("ChampionBattleEvent");
    jsonCache.preloadProto("ChampionBattleEventQuestGroup");
    jsonCache.preloadProto("CyclicRankingEvent");
    jsonCache.preloadProto("CyclicRankingQuestGroup");
    jsonCache.preloadProto("CyclicRankingQuestGroupSchedule");
    jsonCache.preloadProto("EventBanner");
    jsonCache.preloadProto("EventQuestGroup");
    jsonCache.preloadProto("HomeEventAppeal");
    jsonCache.preloadProto("ItemSet");
    jsonCache.preloadProto("LegendQuestGroup");
    jsonCache.preloadProto("LegendQuestGroupSchedule");
    jsonCache.preloadProto("LoginBonus");
    jsonCache.preloadProto("LoginBonusReward");
    jsonCache.preloadProto("Mission");
    jsonCache.preloadProto("MissionGroup");
    jsonCache.preloadProto("QuestReward");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("StoryQuest");
    jsonCache.preloadProto("VillaQuestGroup");

    // LSD
    jsonCache.preloadLsd("banner_text");
    jsonCache.preloadLsd("event_appeal_contents_upper")
    jsonCache.preloadLsd("event_name");
    jsonCache.preloadLsd("login_bonus_name");
    jsonCache.preloadLsd("paid_virtual_currency");
    jsonCache.preloadLsd("story_quest_name");

    // CUSTOM
    jsonCache.preloadCustom("version_release_dates");

    // Locale
    jsonCache.preloadLocale("gems_count");

    // Other Preloads
    preloadUtils(true);

    await jsonCache.runPreload();

    jData.proto.championBattleEventQuestGroup = jData.proto.championBattleEventQuestGroup.map(cbeqg => {
        cbeqg.bannerId = jData.proto.championBattleEvent.find(cbe => cbe.championBattleEventId === cbeqg.championBattleEventId).bannerId;

        jData.proto.banner.map(ban => {
            if(ban.bannerId === cbeqg.bannerId && ban.type === 25) {
                if(ban.text1Id == -1)
                    ban.text1Id = CBEText1Id;

                if(ban.text2Id == -1)
                    ban.text2Id = CBEText2Id;
            }
        });

        return cbeqg;
    });


    jData.proto.eventQuestGroup.push(...jData.proto.challengeToStrongTrainerQuestGroup);
    jData.proto.eventQuestGroup.push(...jData.proto.championBattleEventQuestGroup);
    jData.proto.eventQuestGroup.push(...jData.proto.villaQuestGroup.map(vqg => {
        vqg.bannerId = 1202001
        return vqg;
    }));

    jData.proto.cyclicRankingData = getBySpecificID(jData.proto.cyclicRankingQuestGroupSchedule, "scheduleId");
    jData.proto.legendQuestGroup = getBySpecificID(jData.proto.legendQuestGroup, "questGroupId");
    jData.proto.legendQuestGroupSchedule = getBySpecificID(jData.proto.legendQuestGroupSchedule, "scheduleId");

    orderByVersion(jData.custom.versionReleaseDates);

    getSchedule();

    lastScheduleStartDate = lastScheduleStartDate = Math.max(...new Set(jData.proto.schedule.map(s => s.startDate*1)));

    jData.proto.loginBonus = jData.proto.loginBonus.filter(lb => lb.startDate <= lastScheduleStartDate).map(lb => {
        lb.scheduleId = lb.loginBonusId;
        lb.startDate = lb.startDate.toString();
        lb.endDate = lb.endDate.toString();
        return lb;
    });

    loginBonusIds = jData.proto.loginBonus.map(lb => lb.loginBonusId);

    jData.proto.schedule.push(...jData.proto.loginBonus);
}

function changeHtmlTexts() {
    versionSelect = document.createElement("select");
    versionSelect.id = "versionSelect";

    document.getElementById("verSelDiv").appendChild(versionSelect);
    document.getElementById("changeVersion").innerText = jData.locale.gemsCount.change_version;
}

function scheduleByVersion() {
    while(versionSelect.length > 0) {
        versionSelect.remove(0);
    }

    for(let i = 0; i < jData.custom.versionReleaseDates.length - 1; i++) {
        let date = new Date(jData.custom.versionReleaseDates[i].releaseTimestamp*1000);

        let option = {};
        option.value = jData.custom.versionReleaseDates[i].version;
        option.text = `Version ${jData.custom.versionReleaseDates[i].version} (${date.toLocaleDateString(locale, {year: 'numeric', month: 'short', day: 'numeric'})})`;
        versionSelect.add(new Option(option.text, option.value));
    }
}

function getSchedule() {

    championBattleAllPeriod = [...new Set(jData.proto.schedule.filter(s => s.scheduleId.endsWith("ChampionBattle_AllPeriod")))];
    cyclicRankingIds = [...new Set(jData.proto.cyclicRankingQuestGroupSchedule.map(crqg => crqg.scheduleId))];
    eventIds = [...new Set(jData.proto.storyQuest.filter(sq => !sq.scheduleId.includes("_ChampionBattle_")).map(sq => sq.scheduleId))];
    legendaryBattleIds = [...new Set(Object.keys(jData.proto.legendQuestGroupSchedule))];
    mainStoryUpdate = [...new Set(jData.proto.storyQuest.filter(sq => sq.questType === "MainStory").map(sq => sq.scheduleId))];
    missionGroupIds = [...new Set(jData.proto.missionGroup.map(mg => mg.scheduleId))];
    trainingAreaUpdate = [...new Set(jData.proto.storyQuest.filter(sq => sq.questType === "TrainingArea" || sq.questType === "TrainingArea2").map(sq => sq.scheduleId))];

    const usableSchedule = jData.proto.schedule.filter(s =>
        eventIds.includes(s.scheduleId) ||
        legendaryBattleIds.includes(s.scheduleId) ||
        mainStoryUpdate.includes(s.scheduleId) ||
        missionGroupIds.includes(s.scheduleId) ||
        trainingAreaUpdate.includes(s.scheduleId) ||
        (s.scheduleId.includes("_ChampionBattle_") &&
            !(s.scheduleId.endsWith("_AllPeriod") ||
                s.scheduleId.endsWith("_Emblem") ||
                s.scheduleId.endsWith("FOREVER") ||
                s.scheduleId.endsWith("_option")
            ))
    );

    // console.log(jData.proto.schedule.filter(s => s.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp && !usableSchedule.includes(s.scheduleId)));
    // console.log(usableSchedule.filter(us => us.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp));

    jData.proto.schedule = usableSchedule;
}

function getVersionSchedule(versionId) {
    let ver = jData.custom.versionReleaseDates.find(vrd => vrd.version === versionId);

    if(ver.schedule)
        return;

    let idx = jData.custom.versionReleaseDates.indexOf(ver);

    ver.schedule = jData.proto.schedule.filter(s =>
        s.startDate >= ver.releaseTimestamp
        && (idx === 0 || s.startDate < jData.custom.versionReleaseDates[idx-1].releaseTimestamp)
    ).map(s => {
        s.isLegendaryBattle = false;
        s.isHomeAppeal = false;
        s.isVilla = false;

        if(loginBonusIds.includes(s.scheduleId)) {
            s.scheduleType = { "name" : "loginBonus", "priority": "500" };
        }
        else if(s.scheduleId.includes("_ChampionBattle_")) {
            s.scheduleType = { "name" : "championBattle", "priority": "-1" };
        }
        else if(missionGroupIds.includes(s.scheduleId)) {
            s.scheduleType = { "name" : "mission", "priority": "750" };
        }
        else {
            s.scheduleType = { "name" : "event", "priority": "1000" };

            if(legendaryBattleIds.includes(s.scheduleId)) {
                s.isLegendaryBattle = true;
            }
            if(trainingAreaUpdate.includes(s.scheduleId) || mainStoryUpdate.includes(s.scheduleId)) {
                s.isHomeAppeal = true;
            }
        }
        return s;
    }).filter(s => s.scheduleType.name !== "championBattle");

    jData.custom.versionReleaseDates[idx].schedule = ver.schedule.sort((a, b) => {
        return  a.scheduleType.priority.localeCompare(b.scheduleType.priority) || a.startDate.localeCompare(b.startDate)
    });

    jData.custom.versionReleaseDates[idx].events = getEvents(jData.custom.versionReleaseDates[idx]);
    jData.custom.versionReleaseDates[idx].loginBonus = getLoginBonus(jData.custom.versionReleaseDates[idx]);
    jData.custom.versionReleaseDates[idx].shop = getShopAndDailyMissions(jData.custom.versionReleaseDates[idx], idx === 0 ? (lastScheduleStartDate + 86400) : (jData.custom.versionReleaseDates[idx-1].releaseTimestamp + 3600));
    jData.custom.versionReleaseDates[idx].missions = getMissions(jData.custom.versionReleaseDates[idx]);
}

function getEvents(version) {
    return version.schedule.filter(s => s.scheduleType.name === "event")
        .map(s => {
            let obj = {
                "isHomeAppeal": false,
                "isQuestGroup": false,
                "questGroupId": null
            };

            if(s.isHomeAppeal) {
                obj.isHomeAppeal = true;
                obj.homeEventAppeal = jData.proto.homeEventAppeal.find(hea => hea.bannerScheduleId === s.scheduleId);
                if(obj.homeEventAppeal === undefined) {
                    return null;
                }
            }

            const qid = Array.from(new Set(jData.proto.storyQuest
                .filter(quest => quest.scheduleId === s.scheduleId && quest.questType !== "SyncPairStories")
                .map(q => q.questGroupId)
                .filter(qg => qg !== undefined && qg !== '1')));

            if(qid.length === 0) {
                return null;
            }

            const storyQuests = jData.proto.storyQuest.filter(sq => qid.includes(sq.questGroupId))
                .map(sq => jData.proto.schedule.find(s => s.scheduleId === sq.scheduleId)).filter(sq => sq !== undefined);

            const questGroupStartDate = Math.min(...storyQuests.map(sq => sq.startDate));

            if(questGroupStartDate && (questGroupStartDate !== parseInt(s.startDate) || questGroupStartDate < version.releaseTimestamp)) {
                return null;
            }

            obj.isQuestGroup = true;
            obj.questGroupId = qid;
            obj.questGroupStartDate = questGroupStartDate;
            obj.schedule = s;

            return obj;
        }).filter(event => event !== null).reduce((acc, cur) => {
            if(!acc.find((evt) => evt.questGroupId.toString() === cur.questGroupId.toString())) {
                acc.push(cur);
            }
            return acc;
        }, []).filter((event, index, self) => {
        const _event = JSON.stringify(event);
        return (
            index === self.findIndex((obj) => {
                return JSON.stringify(obj) === _event;
            })
        );
    }).map(event => {
        event.name = getEventName(event);
        event.gemCount = getEventCount(event);
        return event;
    }).sort((a, b) =>
        a.schedule.startDate.localeCompare(b.schedule.startDate) || a.name.localeCompare(b.name)
    );
}

function getLoginBonus(version) {
    return version.schedule.filter(s => s.scheduleType.name === "loginBonus")
        .map(s =>  {
            let obj = {
                "name": (jData.lsd.loginBonusName[s.loginBonusNameId] || "unknown").replace("\n", " "),
                "gemCount": getLoginBonusCount(s),
                "schedule": s
            }

            return obj;
        }).reduce((acc, cur) => {
            if(!acc.find(lb => lb.name === cur.name)) {
                if(cur.gemCount === 0)
                    return acc;
                acc.push(cur);
            } else {
                acc.find(lb => lb.name === cur.name).gemCount += cur.gemCount;
            }
            return acc;
        }, []).sort((a, b) =>
            a.schedule.startDate.localeCompare(b.schedule.startDate) || a.name.localeCompare(b.name)
        );
}

function getShopAndDailyMissions(version, endDate) {
    let obj = {};

    obj[jData.lsd.paidVirtualCurrency["4310009"]] = 0;  // Daily
    obj[jData.lsd.paidVirtualCurrency["4310010"]] = 0;  // Weekly
    obj[jData.lsd.paidVirtualCurrency["4310011"]] = 0;  // Monthly

    version.dailyMissions = [];

    for(let start = new Date((version.releaseTimestamp + 3600) * 1000), end = new Date(endDate * 1000);start < end; start.setDate(start.getDate() + 1), obj[jData.lsd.paidVirtualCurrency["4310009"]] += 20) {

        if(start.getDay() === 1) {
            obj[jData.lsd.paidVirtualCurrency["4310010"]] += 100;
        }

        if(start.getDate() === 1) {
            obj[jData.lsd.paidVirtualCurrency["4310011"]] += 300;
        }

        version.dailyMissions.push(getMissionsDetailsFromSchedule(jData.proto.schedule.find(s => s.scheduleId === "5080_DAILY_MISSION_START"), jData.locale.gemsCount.daily_missions));
    }

    return Object.keys(obj).map(k => {
        return { "name": k, "gemCount": obj[k] };
    });
}

function getMissionsDetailsFromSchedule(s, missionName = undefined) {
    const missionGroup = jData.proto.missionGroup.find(mg => mg.scheduleId === s.scheduleId);
    const name = missionName ?? getBannerText(jData.proto.banner.find(b => b.bannerId === missionGroup.bannerId));
    const missionList = jData.proto.mission.filter(m => m.missionGroupId === missionGroup.missionGroupId);

    let count = getGemsCountFromItemSet(missionGroup.itemSetId);

    for(const mission of missionList) {
        for(const itemSetId of mission.itemSetIds) {
            count += getGemsCountFromItemSet(itemSetId);
        }
    }

    return {
        "name": name,
        "gemCount": count,
        "schedule": s
    };
}

function getMissions(version) {
    return version.schedule.filter(s => s.scheduleType.name === "mission")
        .map(s => getMissionsDetailsFromSchedule(s)).concat(version.dailyMissions)
        .reduce((acc, cur) => {
        if(!acc.find(mg => mg.name === cur.name)) {
            if(cur.gemCount === 0)
                return acc;
            acc.push(cur);
        } else {
            acc.find(mg => mg.name === cur.name).gemCount += cur.gemCount;
        }
        return acc;
    }, []).sort((a, b) =>
        a.schedule.startDate.localeCompare(b.schedule.startDate) || a.name.localeCompare(b.name)
    );
}

function getGemTable(id) {
    let version = jData.custom.versionReleaseDates.find(v => v.version === id);

    if(version === undefined)
        return;

    gemsCountDiv.innerHTML = "";

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let theadRow = document.createElement("tr");

    let thType = document.createElement("th");
    thType.innerHTML = "&nbsp;";
    theadRow.appendChild(thType);

    let thName = document.createElement("th");
    thName.innerText = jData.locale.gemsCount.title_name;
    theadRow.appendChild(thName);

    let thCount = document.createElement("th");
    thCount.innerText = jData.locale.gemsCount.title_gems;
    theadRow.appendChild(thCount);

    thead.appendChild(theadRow);
    table.appendChild(thead);

    totalGemsCount = 0;

    appendCategory(table, version.events, jData.locale.gemsCount.events);
    appendCategory(table, version.loginBonus, jData.locale.gemsCount.login_bonus);
    appendCategory(table, version.shop, jData.locale.gemsCount.shop);
    appendCategory(table, version.missions, jData.locale.gemsCount.missions);

    let totalTr = document.createElement("tr");

    let totalTh = document.createElement("th");
    totalTh.innerText = jData.locale.gemsCount.title_total;
    totalTh.colSpan = 2;
    totalTh.classList.add("countValue");
    totalTr.appendChild(totalTh);

    let totalTd = document.createElement("td");
    totalTd.innerHTML = `<b>${totalGemsCount}</b>`;
    totalTd.classList.add("countValue");
    totalTr.appendChild(totalTd);

    table.appendChild(totalTr);

    gemsCountDiv.appendChild(table);
}

function appendCategory(table, category, name) {
    let rowSpan = 0;
    let lastTh = null;

    let tbody = document.createElement("tbody");

    for(let i = 0; i < category.length; i++) {
        if(category[i].gemCount === 0)
            continue;

        let tr = document.createElement("tr");

        if(rowSpan === 0) {
            lastTh = document.createElement("th");
            lastTh.innerText = name;
            tr.appendChild(lastTh);
        }

        rowSpan++;

        let tdName = document.createElement("td");
        tdName.innerText = category[i].name;
        tdName.classList.add("countName");
        tr.appendChild(tdName);

        let tdCount = document.createElement("td");
        tdCount.innerText = category[i].gemCount;
        tdCount.classList.add("countValue");
        tr.appendChild(tdCount);

        tbody.appendChild(tr);

        totalGemsCount += category[i].gemCount;
    }

    if(lastTh !== null)
        lastTh.rowSpan = rowSpan;

    table.appendChild(tbody);
}

function getEventName(event) {

    let banner;

    if(event.isHomeAppeal) {
        if(!event.homeEventAppeal) {
            return "UNDEFINED";
        }
        return jData.lsd.eventAppealContentsUpper[event.homeEventAppeal.eventAppealContentsUpper].replace("\n", " ") || "UNDEFINED";
    }
    else if(event.isLegendaryBattle) {
        return "legendaryBattle";
    }

    const storyQuests = Array.from(new Set(event.questGroupId
        .map(qgid => jData.proto.storyQuest.find(sq => sq.questGroupId === qgid))
        .filter(sq => sq && sq.questType === "ChampionBattleEvent")));

    // Champion Battle Event
    if(storyQuests.length > 0) {
        const cbeqg = jData.proto.championBattleEventQuestGroup.find(cbeqg => cbeqg.questGroupId.toString() === storyQuests[0].questGroupId);
        banner = jData.proto.banner.find(b => b.bannerId === cbeqg.bannerId);
    }
    else {
        const eqg = Array.from(new Set(event.questGroupId
            .map(qgid => jData.proto.eventQuestGroup.find(eqg => eqg.questGroupId === qgid))
            .filter(eqg => eqg !== undefined)));

        if(eqg.length === 0) {
            console.log("UNDEFINED EVENT", event);
            return "UNDEFINED EVENT";
        }
        banner = jData.proto.banner.find(b => b.bannerId === eqg[0].bannerId);
    }

    return getBannerText(banner);

}

function getBannerText(banner) {
    let text = "";

    if(banner) {
        if(banner.text1Id > -1) {
            text += jData.lsd.bannerText[banner.text1Id];

            if(banner.text2Id > -1) {
                text += ` - ${jData.lsd.bannerText[banner.text2Id]}`;
            }
        }
        else if(banner.text2Id > -1) {
            text += jData.lsd.bannerText[banner.text2Id];
        }

        return text.replace("\n", " ");
    }

    return "UNDEFINED BANNER TEXT";
}

function getEventCount(event) {
    let count = 0;

    let scheduleQuests = jData.proto.storyQuest.filter(quest => quest.questGroupId === event.questGroupId[0]);

    if(scheduleQuests.length === 0)
        return 0;

    for(const quest in scheduleQuests) {
        const qr = jData.proto.questReward.filter(qr => qr.storyQuestId === scheduleQuests[quest].storyQuestId);

        if(qr.length === 0)
            continue;

        for(const qrItem in qr) {
            count += getGemsCountFromItemSet(qr[qrItem].itemSetId);
        }
    }

    return count;
}

function getLoginBonusCount(schedule) {
    let count = 0;

    //TODO - Prendre en compte les login bonus qui commencent AVANT la date de la version + Grouper les bonus de connexion normal
    const loginBonus = jData.proto.loginBonus.find(lb => lb.loginBonusId === schedule.scheduleId);
    const rewards = jData.proto.loginBonusReward.filter(lbr => lbr.rewardId === loginBonus.rewardId);

    for(const lbr in rewards) {
        count += getGemsCountFromItemSet(rewards[lbr].itemSetId);
    }

    return count;
}

function getGemsCountFromItemSet(itemSetId) {
    let count = 0;
    const is = jData.proto.itemSet.find(is => is.itemSetId === itemSetId);

    for(let i = 1; is[`item${i}`] && is[`item${i}`] !== "0"; i++) {
        if(is[`item${i}`] === gemsItemId) {
            count += is[`item${i}Quantity`];
        }
    }

    return count;
}

function setVersion(id, setUrl = true) {
    versionSelect.value = id;

    getVersionSchedule(id);

    const idx = jData.custom.versionReleaseDates.findIndex(v => v.version === id);
    const ver = jData.custom.versionReleaseDates[idx];
    const endTimestamp = idx > 0 ? jData.custom.versionReleaseDates[idx - 1].releaseTimestamp + 3600 : lastScheduleStartDate + 86400;
    const start = new Intl.DateTimeFormat(locale, {dateStyle: 'short', timeStyle: 'short'}).format(new Date((ver.releaseTimestamp + 3600) * 1000));
    const end = new Intl.DateTimeFormat(locale, {dateStyle: 'short', timeStyle: 'short'}).format(new Date(endTimestamp * 1000-1));

    document.getElementById("period").innerText = ` (${start} - ${end})`;

    getGemTable(id);

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

async function init() {
    gemsCountDiv = document.getElementById("gemsCountDiv");

    await buildHeader();
    await getData();

    document.getElementById("pageTitle").innerText = jData.locale.common.adminsubmenu_gem_count;
    document.getElementById("disclaimer").innerHTML = jData.locale.gemsCount.disclaimer;

    changeHtmlTexts();

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
}

init().then();
