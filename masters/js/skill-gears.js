let itemExchange;
let itemSet;
let progressEvent, progressEventRewardGroup;
let storyQuest;

let skillDeckItemConditionTeamSkillTagLot;
let skillDeckItemEffect;
let skillDeckItemEffectLot;
let skillDeckItemLotParamCoefficient;
let skillDeckItemNumLot;
let skillDeckItemParamLot;
let skillDeckItemSkillFeatherItem;
let teamSkill;

let skillDeckItemSkillFeatherItemName;
let teamSkillEffect;
let teamSkillTag;

let schedule;
let versions;

let skillGearsLocale;

let featherListDiv;
let skillGearsDiv;


async function getData() {
    itemExchange = await jsonCache.getProto("ItemExchange");

    itemSet = await jsonCache.getProto("ItemSet");

    progressEvent = await jsonCache.getProto("ProgressEvent");
    progressEventRewardGroup = await jsonCache.getProto("ProgressEventRewardGroup");

    schedule = await jsonCache.getProto("Schedule");

    skillDeckItemConditionTeamSkillTagLot = await jsonCache.getProto("SkillDeckItemConditionTeamSkillTagLot");

    skillDeckItemEffect = await jsonCache.getProto("SkillDeckItemEffect");

    skillDeckItemEffectLot = await jsonCache.getProto("SkillDeckItemEffectLot");

    skillDeckItemLotParamCoefficient = await jsonCache.getProto("SkillDeckItemLotParamCoefficient");

    skillDeckItemNumLot = await jsonCache.getProto("SkillDeckItemNumLot");

    skillDeckItemParamLot = await jsonCache.getProto("SkillDeckItemParamLot");

    skillDeckItemSkillFeatherItem = await jsonCache.getProto("SkillDeckItemSkillFeatherItem");

    storyQuest = await jsonCache.getProto("StoryQuest");

    skillDeckItemSkillFeatherItemName = await jsonCache.getLsd("skill_deck_item_skill_feather_item_name");

    teamSkill = await jsonCache.getProto("TeamSkill");
    teamSkillTag = await jsonCache.getLsd("team_skill_tag");
    teamSkillEffect = await jsonCache.getLsd("team_skill_effect");
}

async function getCustomJSON() {
    skillGearsLocale = await jsonCache.getLocale("skill-gears");
    versions = await jsonCache.getCustom("version_release_dates").then(orderByVersion);
}

function getProgressEventRewardFeathers(featherList, lastVersionScheduleStarts) {
    let itemSetIds = itemSet.filter(is => featherList.includes(is.item1)).map(is => is.itemSetId);
    let progressEventEQGIds = progressEvent.map(pe => pe.questGroupId);
    let lastVersionQuestGroups = storyQuest.filter(sq => lastVersionScheduleStarts.includes(sq.scheduleId) && progressEventEQGIds.includes(sq.questGroupId)).map(sq => sq.questGroupId);

    return progressEventRewardGroup.filter(perg => lastVersionQuestGroups.includes(perg.progressEventId) && itemSetIds.includes(perg.itemSetId)).map(perg => itemSet.find(is => is.itemSetId === perg.itemSetId).item1);
}

function getNewSpecialFeathers() {
    let featherList = [...new Set(skillDeckItemSkillFeatherItem.filter(sdisfi => sdisfi.skillFeatherItemDescription === "9302").map(sdisfi => sdisfi.itemId))];
    let lastVersionScheduleStarts = schedule.filter(s => s.startDate >= versions[0].releaseTimestamp).map(s => s.scheduleId);
    let featherIds = itemExchange.filter(ie => featherList.includes(ie.itemId) && lastVersionScheduleStarts.includes(ie.scheduleId)).map(ie => ie.itemId);

    featherIds.push(...getProgressEventRewardFeathers(featherList, lastVersionScheduleStarts));

    return skillDeckItemSkillFeatherItem.filter(sdisfi => featherIds.includes(sdisfi.itemId));
}

function getFeatherItemImage(feather) {
    let img = document.createElement("img");
    img.style.backgroundImage = `url(./data/item/Frame/128/if01_0${feather.rarity}_128.png)`;
    img.style.backgroundSize = "64px 64px";

    img.src = `./data/item/${feather.imgName}/${feather.imgName}_128.png`;
    img.style.width = "64px";
    img.style.height = "64px";
    return img;
}

function getFeatherLi(feather) {
    let newLi = document.createElement("li");
    newLi.classList.add("listh-bipcode");
    newLi.style.width = "100px";
    newLi.appendChild(getFeatherItemImage(feather));

    newLi.appendChild(document.createElement("br"));

    let link = document.createElement("a");
    link.onclick = () => printFeatherInfos(feather);
    link.href = `#feather_${feather.itemId}`;
    link.innerHTML = `<b>${skillDeckItemSkillFeatherItemName[feather.itemId]}</b>`;

    newLi.classList.add("listh-click");
    newLi.onclick = () => link.click();
    newLi.appendChild(link);

    return newLi;
}

function listFeatherInfos() {

    let newFeathers = getNewSpecialFeathers();
    let normalFeathers = skillDeckItemSkillFeatherItem.filter(sdisfi => sdisfi.skillFeatherItemDescription === "9301");
    let specialFeathers = skillDeckItemSkillFeatherItem.filter(sdisfi => !normalFeathers.includes(sdisfi));

    if(newFeathers.length > 0) {

        let newFeathersH2 = document.createElement("h2");
        newFeathersH2.innerText = skillGearsLocale.new_feathers;
        featherListDiv.appendChild(newFeathersH2);

        let newUl = document.createElement("ul");
        newUl.classList.add("listh-bipcode");

        for(let i = 0; i < newFeathers.length; i++) {
            newUl.appendChild(getFeatherLi(newFeathers[i]));
        }

        featherListDiv.appendChild(newUl);
    }

    let normalFeathersH2 = document.createElement("h2");
    normalFeathersH2.innerText = skillGearsLocale.normal_feathers;
    featherListDiv.appendChild(normalFeathersH2);

    let normalUl = document.createElement("ul");
    normalUl.classList.add("listh-bipcode");

    for(let i = 0; i < normalFeathers.length; i++) {
        normalUl.appendChild(getFeatherLi(normalFeathers[i]));
    }

    featherListDiv.appendChild(normalUl);

    let specialFeathersH2 = document.createElement("h2");
    specialFeathersH2.innerText = skillGearsLocale.special_feathers;
    featherListDiv.appendChild(specialFeathersH2);

    let specialUl = document.createElement("ul");
    specialUl.classList.add("listh-bipcode");

    for(let i = 0; i < specialFeathers.length; i++) {
        specialUl.appendChild(getFeatherLi(specialFeathers[i]));
    }

    featherListDiv.appendChild(specialUl);

    printFeatherInfos(newFeathers[0]);
}

function printSlotsTable(lots, div) {
    if(lots.length <= 0) return;

    let slotsTable = document.createElement("table");
    slotsTable.classList.add("bipcode");
    slotsTable.style.textAlign = "center";

    let slotsTHead = document.createElement("thead");

    let slotsHeadTr = document.createElement("tr");

    let slotsHeadNumSlots = document.createElement("th");
    slotsHeadNumSlots.innerText = skillGearsLocale.num_slots;
    slotsHeadTr.appendChild(slotsHeadNumSlots);

    let slotsHeadChances = document.createElement("th");
    slotsHeadChances.innerText = skillGearsLocale.chances;
    slotsHeadTr.appendChild(slotsHeadChances);

    slotsTHead.appendChild(slotsHeadTr);
    slotsTable.appendChild(slotsTHead);

    let slotsTBody = document.createElement("tbody");

    let slotsTotalWeight = lots.map(sl => sl.entryWeight).reduce((a, b) => a + b, 0);

    for(let i = 0; i < lots.length; i++) {
        let tr = document.createElement("tr");
        let numTd = document.createElement("td");
        numTd.innerText = lots[i].numGuaranteedSlots;
        tr.appendChild(numTd);

        let chanceTd = document.createElement("td");
        chanceTd.innerText = `${Math.round(lots[i].entryWeight / slotsTotalWeight * 100)}%`;
        tr.appendChild(chanceTd);
        slotsTBody.appendChild(tr);
    }

    slotsTable.appendChild(slotsTBody);

    div.appendChild(slotsTable);
    div.appendChild(document.createElement("br"));
}

function printFeatherTeamSkills(feather, div) {

    let h3 = document.createElement("h3");
    h3.innerText = skillGearsLocale.team_skills;
    div.appendChild(h3);

    let slotsLots = skillDeckItemNumLot
        .filter(sdinl => parseInt(sdinl.numLot) === feather.teamSkillTagNumLot)
        .sort((a, b) => a.numGuaranteedSlots - b.numGuaranteedSlots);

    printSlotsTable(slotsLots, div);

    let ul = document.createElement("ul");
    ul.classList.add("listh-bipcode");
    div.appendChild(ul);

    let teamSkillSet = skillDeckItemConditionTeamSkillTagLot.filter(x => x.setId === feather.teamSkillTagLotSetId);

    for(let i = 0; i < teamSkillSet.length; i++) {
        let li = document.createElement("li");
        li.classList.add("listh-bipcode");
        li.innerHTML = `<b>${teamSkillTag[teamSkillSet[i].teamSkillTagId]}</b>`;
        ul.appendChild(li);
    }

    div.appendChild(ul);
}

function printStatsTable(equipment, paramLots, ul) {
    let li = document.createElement("li");
    li.classList.add("listh-no-style");

    let title = document.createElement("h1");
    title.innerText = skillGearsLocale.equipment_name[equipment];
    li.appendChild(title);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let titleRow = document.createElement("tr");

    let statName = document.createElement("th");
    statName.innerText = skillGearsLocale.stat_name_title;

    let statMin = document.createElement("th");
    statMin.innerText = skillGearsLocale.stat_min_title;

    let statMax = document.createElement("th");
    statMax.innerText = skillGearsLocale.stat_max_title;

    let chances = document.createElement("th");
    chances.innerText = skillGearsLocale.chances;

    titleRow.appendChild(statName);
    titleRow.appendChild(statMin);
    titleRow.appendChild(statMax);
    titleRow.appendChild(chances);
    thead.appendChild(titleRow);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    let totalWeight = paramLots.map(pl => pl.entryWeight).reduce((a, b) => a + b, 0);

    paramLots.forEach(pl => {
        let statCoeff = skillDeckItemLotParamCoefficient.find(sdilpc => sdilpc.stat === pl.stat);
        statCoeff = statCoeff ? statCoeff.coefficient : 1;

        let tr = document.createElement("tr");

        let statNameTh = document.createElement("th");
        statNameTh.innerText = commonLocales[pl.stat];

        let statMinTd = document.createElement("td");
        statMinTd.innerText = pl.minStat * statCoeff + "";

        let statMaxTd = document.createElement("td");
        statMaxTd.innerText = pl.maxStat * statCoeff + "";

        let chanceTd = document.createElement("td");
        chanceTd.innerText = `${Math.round(pl.entryWeight/totalWeight * 100)}%`;

        tr.appendChild(statNameTh);
        tr.appendChild(statMinTd);
        tr.appendChild(statMaxTd);
        tr.appendChild(chanceTd);
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    li.appendChild(table);
    ul.appendChild(li);
}

function printFeatherStats(feather, div) {

    let h3 = document.createElement("h3");
    h3.innerText = skillGearsLocale.stats;
    div.appendChild(h3);

    let slotsLots = skillDeckItemNumLot
        .filter(sdinl => parseInt(sdinl.numLot) === feather.statsNumLot)
        .sort((a, b) => a.numGuaranteedSlots - b.numGuaranteedSlots);

    printSlotsTable(slotsLots, div);

    let paramLots = skillDeckItemParamLot
        .filter(sdipl => parseInt(sdipl.skillDeckItemNumLot) === feather.statsParamLot);

    let ul = document.createElement("ul");
    ul.classList.add("listh-bipcode");

    let availableEquipments = [...new Set(paramLots.map(sl => sl.equipmentType))];

    availableEquipments.forEach(equipment => printStatsTable(equipment, paramLots.filter(pl => pl.equipmentType === equipment), ul));

    div.appendChild(ul);

}

function printFeatherPassiveSkills(feather, div) {
    let h3 = document.createElement("h3");
    h3.innerText = skillGearsLocale.passive_skills;
    div.appendChild(h3);

    let slotsLots = skillDeckItemNumLot
        .filter(sdinl => parseInt(sdinl.numLot) === feather.skillNumLot)
        .sort((a, b) => a.numGuaranteedSlots - b.numGuaranteedSlots);

    printSlotsTable(slotsLots, div);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let passiveName = document.createElement("th");
    passiveName.innerText = skillGearsLocale.passive_name_title;

    let passiveDescr = document.createElement("th");
    passiveDescr.innerText = skillGearsLocale.passive_descr_title;

    tr.appendChild(passiveName);
    tr.appendChild(passiveDescr);
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    let lot = skillDeckItemEffectLot.filter(x => x.skillSetId === feather.skillSetId);

    for(let i = 0; i < lot.length; i++) {
        let tr = document.createElement("tr");

        let passiveName = document.createElement("td");
        passiveName.innerText = getPassiveSkillName(lot[i].passiveSkillId);

        let passiveDescr = document.createElement("td");
        passiveDescr.innerText = getPassiveSkillDescr(lot[i].passiveSkillId);
        tr.appendChild(passiveName);
        tr.appendChild(passiveDescr);

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    div.appendChild(table);
}

function printFeatherInfos(feather) {
    skillGearsDiv.innerHTML = "";
    let div = document.createElement("div");
    div.id = `feather_${feather.itemId}`;
    div.style.scrollMarginTop = "5em";

    let h2 = document.createElement("h2");
    h2.innerText = skillDeckItemSkillFeatherItemName[feather.itemId];
    div.appendChild(h2);

    printFeatherTeamSkills(feather, div);
    printFeatherStats(feather, div);
    printFeatherPassiveSkills(feather, div);

    skillGearsDiv.appendChild(div);
}

async function init() {
    skillGearsDiv = document.getElementById("skillGearsDiv");
    featherListDiv = document.getElementById("featherListDiv");
    //toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await initMovePassiveSkills();
    await getData();
    await getCustomJSON();

    document.getElementById("pageTitle").innerText = commonLocales.submenu_skill_gear;

    // if(isAdminMode) {
    //     dataArea = document.getElementById("dataArea");
    //
    //     toolsDiv.style.display = "table";
    //
    //     let downloadAllBtn = document.getElementById("downloadAll");
    //     downloadAllBtn.onclick = downloadAll;
    //
    //     let downloadOneBtn = document.getElementById("downloadOne");
    //     downloadOneBtn.onclick = downloadData;
    //
    //     let copyBtn = document.getElementById("copyBtn");
    //     copyBtn.addEventListener('click', () => navigator.clipboard.writeText(dataArea.value));
    // }

    listFeatherInfos();

    if(window.location.hash !== "" && window.location.hash !== "#") {
        setTimeout(function () {
            let tmp = document.createElement("a");
            tmp.href = window.location.hash;
            tmp.click();
        }, 1000);
    }
}

function getPassiveSkillBipCode(t, v = null) {
    let string = `[center][table]\n`
        + `\t[tr][th|colspan=2]Talents passifs[/th][/tr]\n`
        + `\t[tr][th|width=200px]Nom[/th][th|width=400px]Effet[/th][/tr]\n`;

    for(let i = 1; i <= 4; i++) {
        const passiveId = v && v[`passive${i}Id`] > 0 ? v[`passive${i}Id`] : t[`passive${i}Id`];

        if(passiveId === 0)
            continue;

        string += `\t[tr][td]${getPassiveSkillName(passiveId)}[/td][td]${getPassiveSkillDescr(passiveId)}[/td][/tr]\n`;
    }

    string += `[/table][/center]\n\n`;
    return string;
}

async function downloadData() {
    let e = document.createElement('a');
    e.href = window.URL.createObjectURL(
        new Blob([getPairBipCode(syncPairSelect.value)], {"type": "text/plain"})
    );
    e.setAttribute('download', removeAccents(await getPairName(syncPairSelect.value)));
    e.style.display = 'none';

    document.body.appendChild(e);
    e.click();
    document.body.removeChild(e);
}

async function downloadAll() {
    let zip = new JSZip();
    let trainerIds = trainer.filter(t => t.scheduleId !== "NEVER_CHECK_DICTIONARY" && t.scheduleId !== "NEVER")
        .map(t => t.trainerId);

    for (const tid of trainerIds) {
        let filename = removeAccents(await getPairName(tid)).replace("/", "-") + '.txt';
        zip.file(filename, getPairBipCode(tid));
    }

    zip.generateAsync({type: 'blob'})
        .then(function (content) {
            saveAs(content, "Team-Skills.zip");
        });
}

init().then();
