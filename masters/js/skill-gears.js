let featherListDiv;
let skillGearsDiv;

let typeSelect;
let regionSelect;
let trainerGroupSelect;
let passiveSelect;

async function getData() {

    // PROTO
    jsonCache.preloadProto("ItemExchange");
    jsonCache.preloadProto("ItemSet");
    jsonCache.preloadProto("ProgressEvent");
    jsonCache.preloadProto("ProgressEventRewardGroup");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("SkillDeckItemConditionTeamSkillTagLot");
    jsonCache.preloadProto("SkillDeckItemEffect");
    jsonCache.preloadProto("SkillDeckItemEffectLot");
    jsonCache.preloadProto("SkillDeckItemLotParamCoefficient");
    jsonCache.preloadProto("SkillDeckItemNumLot");
    jsonCache.preloadProto("SkillDeckItemParamLot");
    jsonCache.preloadProto("SkillDeckItemSkillFeatherItem");
    jsonCache.preloadProto("StoryQuest");

    // LSD
    jsonCache.preloadLsd("skill_deck_item_skill_feather_item_name");
    jsonCache.preloadLsd("team_skill_tag");

    // CUSTOM
    jsonCache.preloadCustom("version_release_dates");

    // Locale
    jsonCache.preloadLocale("skill-gears");

    // Other Preloads
    preloadUtils(true);
    preloadMovePassiveSkills()

    await jsonCache.runPreload();
    orderByVersion(jData.custom.versionReleaseDates);
}

function createPassiveFilter(ids, filter) {
    const filterDiv = document.createElement("div");
    filterDiv.style.display = "flex";
    filterDiv.style.flexDirection = "column";
    filterDiv.style.marginRight = "10px";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.innerText = "---";

    let lbl = document.createElement("label");
    lbl.innerText = jData.locale.skillGears.effects;
    lbl.htmlFor = "passiveSelect";
    lbl.style.marginBottom = "5px";
    lbl.style.fontWeight = "bold";
    filterDiv.appendChild(lbl);

    let select = document.createElement("select");
    select.id = "passiveSelect";

    select.appendChild(defaultOption);

    let options = [];

    ids.forEach(passiveId => {
        const option = document.createElement("option");
        option.value = passiveId;
        option.innerText = jData.lsd.passiveSkillNameParts[passiveId].replace(/\[.*\]/, "X");
        options.push(option);
    });

    options.sort((a, b) => a.innerText.localeCompare(b.innerText));
    options.forEach(option => select.appendChild(option));

    select.addEventListener("change", listFeatherInfos);

    filterDiv.appendChild(select);

    return filterDiv;
}

function createFilter(ids, filter) {
    const filterDiv = document.createElement("div");
    filterDiv.style.display = "flex";
    filterDiv.style.flexDirection = "column";
    filterDiv.style.marginRight = "10px";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.innerText = "---";

    let lbl = document.createElement("label");
    lbl.innerText = jData.locale.skillGears[filter];
    lbl.htmlFor = filter + "Select";
    lbl.style.marginBottom = "5px";
    lbl.style.fontWeight = "bold";
    filterDiv.appendChild(lbl);

    let select = document.createElement("select");
    select.id = filter + "Select";

    select.appendChild(defaultOption);

    let options = [];

    ids.forEach(tagId => {
        const option = document.createElement("option");
        option.value = tagId;
        option.innerText = jData.lsd.teamSkillTag[tagId];
        options.push(option);
    });

    options.sort((a, b) => a.innerText.localeCompare(b.innerText));
    options.forEach(option => select.appendChild(option));

    select.addEventListener("change", listFeatherInfos);

    filterDiv.appendChild(select);

    return filterDiv;
}

function appendFilters() {
    const toolbox = document.getElementById("toolbox");

    let filtersDiv = document.createElement("div");
    filtersDiv.style.display = "flex";
    filtersDiv.style.flexDirection = "row";
    toolbox.appendChild(filtersDiv);

    const availableTagIds = jData.proto.skillDeckItemConditionTeamSkillTagLot.reduce((acc, x) => {
        const id = x.teamSkillTagId;

        if (id >= 20010000 && id <= 20019999) acc.Type.add(id);
        else if (id >= 20020000 && id <= 20029999) acc.Region.add(id);
        else if (id >= 20030000 && id <= 20039999) acc.TrainerGroup.add(id);
        else acc.Misc.add(id);

        return acc;

    }, { Type: new Set(), Region: new Set(), TrainerGroup: new Set(), Misc: new Set() });

    const availablePassiveIds = [...new Set(jData.proto.skillDeckItemEffect.map(x => getPassiveSkillNameParts(x.passiveSkillId)).filter(id => id != null))];

    filtersDiv.appendChild(createFilter(availableTagIds.Type, "type"));
    filtersDiv.appendChild(createFilter(availableTagIds.Region, "region"));
    filtersDiv.appendChild(createFilter(availableTagIds.TrainerGroup, "trainerGroup"));
    filtersDiv.appendChild(createPassiveFilter(availablePassiveIds, "passive"));

    typeSelect = document.getElementById("typeSelect");
    regionSelect = document.getElementById("regionSelect");
    trainerGroupSelect = document.getElementById("trainerGroupSelect");
    passiveSelect = document.getElementById("passiveSelect");
}

function getProgressEventRewardFeathers(featherList, lastVersionScheduleStarts) {
    let itemSetIds = jData.proto.itemSet.filter(is => featherList.includes(is.item1)).map(is => is.itemSetId);
    let progressEventEQGIds = jData.proto.progressEvent.map(pe => pe.questGroupId);
    let lastVersionQuestGroups = jData.proto.storyQuest.filter(sq => lastVersionScheduleStarts.includes(sq.scheduleId) && progressEventEQGIds.includes(sq.questGroupId)).map(sq => sq.questGroupId);

    return jData.proto.progressEventRewardGroup.filter(perg => lastVersionQuestGroups.includes(perg.progressEventId) && itemSetIds.includes(perg.itemSetId)).map(perg => jData.proto.itemSet.find(is => is.itemSetId === perg.itemSetId).item1);
}

function getNewSpecialFeathers() {
    let featherList = [...new Set(jData.proto.skillDeckItemSkillFeatherItem.filter(sdisfi => sdisfi.skillFeatherItemDescription === "9302").map(sdisfi => sdisfi.itemId))];
    let lastVersionScheduleStarts = jData.proto.schedule.filter(s => s.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp).map(s => s.scheduleId);
    let featherIds = jData.proto.itemExchange.filter(ie => featherList.includes(ie.itemId) && lastVersionScheduleStarts.includes(ie.scheduleId)).map(ie => ie.itemId);

    featherIds.push(...getProgressEventRewardFeathers(featherList, lastVersionScheduleStarts));

    return jData.proto.skillDeckItemSkillFeatherItem.filter(sdisfi => featherIds.includes(sdisfi.itemId));
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
    link.innerHTML = `<b>${jData.lsd.skillDeckItemSkillFeatherItemName[feather.itemId]}</b>`;

    newLi.classList.add("listh-click");
    newLi.onclick = () => link.click();
    newLi.appendChild(link);

    return newLi;
}

function isTagInSet(tagId, setId) {
    return jData.proto.skillDeckItemConditionTeamSkillTagLot.find(x => x.teamSkillTagId == tagId && x.setId == setId) !== undefined;
}

function isPassiveInSet(passiveNamePartsId, setId) {
    return jData.proto.skillDeckItemEffectLot.filter(x => x.skillSetId === setId).find(x => jData.lsd.passiveSkillName[x.passiveSkillId].includes(passiveNamePartsId)) !== undefined;
}

function applyFilters(featherList) {
    return featherList.filter(feather => {
        if(passiveSelect.value !== "" && !isPassiveInSet(passiveSelect.value, feather.skillSetId)) {
            return false;
        }

        if(typeSelect.value !== "" && !isTagInSet(typeSelect.value, feather.teamSkillTagLotSetId)) {
            return false;
        }

        if (regionSelect.value !== "" && !isTagInSet(regionSelect.value, feather.teamSkillTagLotSetId)) {
            return false;
        }

        return !(trainerGroupSelect.value !== "" && !isTagInSet(trainerGroupSelect.value, feather.teamSkillTagLotSetId));
    });
}

function listFeatherInfos() {
    featherListDiv.innerHTML = "";

    let newFeathers = applyFilters(getNewSpecialFeathers());
    let normalFeathers = applyFilters(jData.proto.skillDeckItemSkillFeatherItem.filter(sdisfi => sdisfi.skillFeatherItemDescription === "9301"));
    let specialFeathers = applyFilters(jData.proto.skillDeckItemSkillFeatherItem.filter(sdisfi => !normalFeathers.includes(sdisfi)));

    if(newFeathers.length > 0) {

        let newFeathersH2 = document.createElement("h2");
        newFeathersH2.innerText = jData.locale.skillGears.new_feathers;
        featherListDiv.appendChild(newFeathersH2);

        let newUl = document.createElement("ul");
        newUl.classList.add("listh-bipcode");

        for(let i = 0; i < newFeathers.length; i++) {
            newUl.appendChild(getFeatherLi(newFeathers[i]));
        }

        featherListDiv.appendChild(newUl);
    }

    let normalFeathersH2 = document.createElement("h2");
    normalFeathersH2.innerText = jData.locale.skillGears.normal_feathers;
    featherListDiv.appendChild(normalFeathersH2);

    let normalUl = document.createElement("ul");
    normalUl.classList.add("listh-bipcode");

    for(let i = 0; i < normalFeathers.length; i++) {
        normalUl.appendChild(getFeatherLi(normalFeathers[i]));
    }

    featherListDiv.appendChild(normalUl);

    let specialFeathersH2 = document.createElement("h2");
    specialFeathersH2.innerText = jData.locale.skillGears.special_feathers;
    featherListDiv.appendChild(specialFeathersH2);

    let specialUl = document.createElement("ul");
    specialUl.classList.add("listh-bipcode");

    for(let i = 0; i < specialFeathers.length; i++) {
        specialUl.appendChild(getFeatherLi(specialFeathers[i]));
    }

    featherListDiv.appendChild(specialUl);

    if(newFeathers.length > 0) {
        printFeatherInfos(newFeathers[0]);
    }
    else {
        printFeatherInfos(normalFeathers[0]);
    }
}

function printSlotsTable(lots, div) {
    if(lots.length <= 0) return;

    let slotsTable = document.createElement("table");
    slotsTable.classList.add("bipcode");
    slotsTable.style.textAlign = "center";

    let slotsTHead = document.createElement("thead");

    let slotsHeadTr = document.createElement("tr");

    let slotsHeadNumSlots = document.createElement("th");
    slotsHeadNumSlots.innerText = jData.locale.skillGears.num_slots;
    slotsHeadTr.appendChild(slotsHeadNumSlots);

    let slotsHeadChances = document.createElement("th");
    slotsHeadChances.innerText = jData.locale.skillGears.chances;
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
    h3.innerText = jData.locale.skillGears.team_skills;
    div.appendChild(h3);

    let slotsLots = jData.proto.skillDeckItemNumLot
        .filter(sdinl => parseInt(sdinl.numLot) === feather.teamSkillTagNumLot)
        .sort((a, b) => a.numGuaranteedSlots - b.numGuaranteedSlots);

    printSlotsTable(slotsLots, div);

    let ul = document.createElement("ul");
    ul.classList.add("listh-bipcode");
    div.appendChild(ul);

    let teamSkillSet = jData.proto.skillDeckItemConditionTeamSkillTagLot.filter(x => x.setId === feather.teamSkillTagLotSetId);

    for(let i = 0; i < teamSkillSet.length; i++) {
        let li = document.createElement("li");
        li.classList.add("listh-bipcode");
        li.innerHTML = `<b>${jData.lsd.teamSkillTag[teamSkillSet[i].teamSkillTagId]}</b>`;
        ul.appendChild(li);
    }

    div.appendChild(ul);
}

function printStatsTable(equipment, paramLots, ul) {
    let li = document.createElement("li");
    li.classList.add("listh-no-style");

    let title = document.createElement("h1");
    title.innerText = jData.locale.skillGears.equipment_name[equipment];
    li.appendChild(title);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let titleRow = document.createElement("tr");

    let statName = document.createElement("th");
    statName.innerText = jData.locale.skillGears.stat_name_title;

    let statMin = document.createElement("th");
    statMin.innerText = jData.locale.skillGears.stat_min_title;

    let statMax = document.createElement("th");
    statMax.innerText = jData.locale.skillGears.stat_max_title;

    let chances = document.createElement("th");
    chances.innerText = jData.locale.skillGears.chances;

    titleRow.appendChild(statName);
    titleRow.appendChild(statMin);
    titleRow.appendChild(statMax);
    titleRow.appendChild(chances);
    thead.appendChild(titleRow);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    let totalWeight = paramLots.map(pl => pl.entryWeight).reduce((a, b) => a + b, 0);

    paramLots.forEach(pl => {
        let statCoeff = jData.proto.skillDeckItemLotParamCoefficient.find(sdilpc => sdilpc.stat === pl.stat);
        statCoeff = statCoeff ? statCoeff.coefficient : 1;

        let tr = document.createElement("tr");

        let statNameTh = document.createElement("th");
        statNameTh.innerText = jData.locale.common[pl.stat];

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
    h3.innerText = jData.locale.skillGears.stats;
    div.appendChild(h3);

    let slotsLots = jData.proto.skillDeckItemNumLot
        .filter(sdinl => parseInt(sdinl.numLot) === feather.statsNumLot)
        .sort((a, b) => a.numGuaranteedSlots - b.numGuaranteedSlots);

    printSlotsTable(slotsLots, div);

    let paramLots = jData.proto.skillDeckItemParamLot
        .filter(sdipl => parseInt(sdipl.skillDeckItemNumLot) === feather.statsParamLot);

    let ul = document.createElement("ul");
    ul.classList.add("listh-bipcode");

    let availableEquipments = [...new Set(paramLots.map(sl => sl.equipmentType))];

    availableEquipments.forEach(equipment => printStatsTable(equipment, paramLots.filter(pl => pl.equipmentType === equipment), ul));

    div.appendChild(ul);

}

function printFeatherPassiveSkills(feather, div) {
    let h3 = document.createElement("h3");
    h3.innerText = jData.locale.skillGears.passive_skills;
    div.appendChild(h3);

    let slotsLots = jData.proto.skillDeckItemNumLot
        .filter(sdinl => parseInt(sdinl.numLot) === feather.skillNumLot)
        .sort((a, b) => a.numGuaranteedSlots - b.numGuaranteedSlots);

    printSlotsTable(slotsLots, div);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let passiveName = document.createElement("th");
    passiveName.innerText = jData.locale.skillGears.passive_name_title;

    let passiveDescr = document.createElement("th");
    passiveDescr.innerText = jData.locale.skillGears.passive_descr_title;

    tr.appendChild(passiveName);
    tr.appendChild(passiveDescr);
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    let lot = jData.proto.skillDeckItemEffectLot.filter(x => x.skillSetId === feather.skillSetId);

    for(let i = 0; i < lot.length; i++) {
        let tr = document.createElement("tr");
        let isBest = jData.proto.skillDeckItemEffect.find(x => x.passiveSkillId === lot[i].passiveSkillId).isBest ?? false;

        let passiveName = document.createElement("td");
        if(isBest) tr.classList.add("passiveName-best");
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
    h2.innerText = jData.lsd.skillDeckItemSkillFeatherItemName[feather.itemId];
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
    await getData();

    document.getElementById("pageTitle").innerText = jData.locale.common.submenu_skill_gear;
    document.getElementById("fieldsetLegend").innerText = jData.locale.common.filters;

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

    appendFilters();

    listFeatherInfos();

    if(window.location.hash !== "" && window.location.hash !== "#") {
        setTimeout(function () {
            let tmp = document.createElement("a");
            tmp.href = window.location.hash;
            tmp.click();
        }, 1000);
    }
}

init().then();
