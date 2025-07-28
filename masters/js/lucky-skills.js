let cookieListDiv;
let passivesDiv;


async function getData() {
    // PROTO
    jsonCache.preloadProto("ItemExchange");
    jsonCache.preloadProto("ItemSet");
    jsonCache.preloadProto("PotentialItem");
    jsonCache.preloadProto("PotentialLot");
    jsonCache.preloadProto("ProgressEvent");
    jsonCache.preloadProto("ProgressEventRewardGroup");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("StoryQuest");

    // LSD
    jsonCache.preloadLsd("potential_item_name");

    // CUSTOM
    jsonCache.preloadCustom("version_release_dates");

    // Locale
    jsonCache.preloadLocale("lucky-skills");

    // Other Preloads
    preloadUtils();
    preloadMovePassiveSkills();

    await jsonCache.runPreload();
    orderByVersion(jData.custom.versionReleaseDates);
}

function getProgressEventRewardCookies(cookiesList, lastVersionScheduleStarts) {
    let itemSetIds = jData.proto.itemSet.filter(is => cookiesList.includes(is.item1)).map(is => is.itemSetId);
    let progressEventEQGIds = jData.proto.progressEvent.map(pe => pe.questGroupId);
    let lastVersionQuestGroups = jData.proto.storyQuest.filter(sq => lastVersionScheduleStarts.includes(sq.scheduleId) && progressEventEQGIds.includes(sq.questGroupId)).map(sq => sq.questGroupId);

    return jData.proto.progressEventRewardGroup.filter(perg => lastVersionQuestGroups.includes(perg.progressEventId) && itemSetIds.includes(perg.itemSetId)).map(perg => jData.proto.itemSet.find(is => is.itemSetId === perg.itemSetId).item1);
}

function getNewCookies() {
    let cookiesList = [...new Set(jData.proto.potentialItem.filter(pi => pi.potentialLotId >= 6000).map(pi => pi.itemId))];
    let lastVersionScheduleStarts = [...new Set(jData.proto.schedule.filter(s => s.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp).map(s => s.scheduleId))];
    let cookieIds = jData.proto.itemExchange.filter(ie => cookiesList.includes(ie.itemId) && lastVersionScheduleStarts.includes(ie.scheduleId)).map(ie => ie.itemId);

    cookieIds.push(...getProgressEventRewardCookies(cookiesList, lastVersionScheduleStarts));

    return jData.proto.potentialItem.filter(pi => cookieIds.includes(pi.itemId));
}

function getCookieItemImage(cookie) {
    return getItemImage(cookie.rarity, cookie.imageId);
}

function getItemImage(rarity, imageId) {
    let img = document.createElement("img");
    img.style.backgroundImage = `url(./data/item/Frame/128/if01_0${rarity}_128.png)`;
    img.style.backgroundSize = "64px 64px";

    img.src = `./data/item/${imageId}/${imageId}_128.png`;
    img.style.width = "64px";
    img.style.height = "64px";
    return img;
}

function getCookieName(cookie) {
    if(cookie.potentialItemName === "")
        return jData.lsd.potentialItemName[cookie.itemId];

    return jData.lsd.potentialItemName[cookie.potentialItemName].replace("[Name:TrainerNameAndType ]", getTrainerName(cookie.trainerId));
}

function getLotLi(lot) {
    let newLi = document.createElement("li");
    newLi.classList.add("listh-bipcode");
    newLi.style.width = "100px";
    newLi.appendChild(getItemImage(9, "i051_0041_00"));

    newLi.appendChild(document.createElement("br"));

    let link = document.createElement("a");
    link.onclick = () => printLotInfos(lot);
    link.href = `#lot_${lot.lotId}`;
    link.innerHTML = `<b>${jData.lsd.potentialItemName["540000000139"].replace("[Name:TrainerNameAndType ]", `[${jData.locale.common.role_name_standard[lot.role]}]`)}</b>`;

    newLi.classList.add("listh-click");
    newLi.onclick = () => link.click();
    newLi.appendChild(link);

    return newLi;
}

function getCookieLi(cookie) {
    let newLi = document.createElement("li");
    newLi.classList.add("listh-bipcode");
    newLi.style.width = "100px";
    newLi.appendChild(getCookieItemImage(cookie));

    newLi.appendChild(document.createElement("br"));

    let link = document.createElement("a");
    link.onclick = () => printCookieInfos(cookie);
    link.href = `#cookie_${cookie.itemId}`;
    link.innerHTML = `<b>${getCookieName(cookie)}</b>`;

    newLi.classList.add("listh-click");
    newLi.onclick = () => link.click();
    newLi.appendChild(link);

    return newLi;
}

function listLuckyCookiesInfos() {

    let newCookies = getNewCookies();

    const towerRoleLotIds = [{"lotId": 707004, "role": "1"}, {"lotId": 707005, "role": "2"}, {"lotId": 707006, "role": "3"}, {"lotId": 707007, "role": "4"}, {"lotId": 707008, "role": "5"}, {"lotId": 707028, "role": "6"}];
    const roleTiedLotIds = towerRoleLotIds.map(lot => lot.lotId);

    let normalCookies = jData.proto.potentialItem.filter(pi => pi.rarity < 9);
    let guaranteedCookies = jData.proto.potentialItem.filter(pi => pi.rarity === 9 && pi.u2 !== "1");
    let trainerCookies = jData.proto.potentialItem.filter(pi => pi.rarity === 9 && pi.u2 === "1" && (pi.potentialItemName !== "540000000139" && pi.potentialItemName !== "540000000138"));
    let towerCookies = jData.proto.potentialItem.filter(pi => !roleTiedLotIds.includes(pi.potentialLotId) && pi.rarity === 9 && pi.u2 === "1" && (pi.potentialItemName === "540000000139" || pi.potentialItemName === "540000000138"));

    if(newCookies.length > 0) {

        let newCookiesH2 = document.createElement("h2");
        newCookiesH2.innerText = jData.locale.luckySkills.new_cookies;
        cookieListDiv.appendChild(newCookiesH2);

        let newUl = document.createElement("ul");
        newUl.classList.add("listh-bipcode");

        for(let i = 0; i < newCookies.length; i++) {
            newUl.appendChild(getCookieLi(newCookies[i]));
        }

        cookieListDiv.appendChild(newUl);
    }

    let normalCookiesH2 = document.createElement("h2");
    normalCookiesH2.innerText = jData.locale.luckySkills.normal_cookies;

    let normalUl = document.createElement("ul");
    normalUl.classList.add("listh-bipcode");

    for(let i = 0; i < normalCookies.length; i++) {
        normalUl.appendChild(getCookieLi(normalCookies[i]));
    }

    let guaranteedCookiesH2 = document.createElement("h2");
    guaranteedCookiesH2.innerText = jData.locale.luckySkills.guaranteed_cookies;

    let guaranteedUl = document.createElement("ul");
    guaranteedUl.classList.add("listh-bipcode");

    for(let i = 0; i < guaranteedCookies.length; i++) {
        guaranteedUl.appendChild(getCookieLi(guaranteedCookies[i]));
    }

    let trainerCookiesH2 = document.createElement("h2");
    trainerCookiesH2.innerText = jData.locale.luckySkills.trainer_cookies;

    let trainerUl = document.createElement("ul");
    trainerUl.classList.add("listh-bipcode");

    for(let i = 0; i < trainerCookies.length; i++) {
        trainerUl.appendChild(getCookieLi(trainerCookies[i]));
    }

    let towerCookiesH2 = document.createElement("h2");
    towerCookiesH2.innerText = jData.locale.luckySkills.tower_cookies;

    let towerCookiesUl = document.createElement("ul");
    towerCookiesUl.classList.add("listh-bipcode");

    for(let i = 0; i < towerRoleLotIds.length; i++) {
        towerCookiesUl.appendChild(getLotLi(towerRoleLotIds[i]));
    }

    for(let i = 0; i < towerCookies.length; i++) {
        towerCookiesUl.appendChild(getCookieLi(towerCookies[i]));
    }

    cookieListDiv.appendChild(guaranteedCookiesH2);
    cookieListDiv.appendChild(guaranteedUl);
    cookieListDiv.appendChild(trainerCookiesH2);
    cookieListDiv.appendChild(trainerUl);
    cookieListDiv.appendChild(towerCookiesH2);
    cookieListDiv.appendChild(towerCookiesUl);
    cookieListDiv.appendChild(normalCookiesH2);
    cookieListDiv.appendChild(normalUl);

    if(newCookies.length > 0) {
        printCookieInfos(newCookies[0]);
    }
    else {
        printCookieInfos(normalCookies[0]);
    }
}

function printLotPassiveSkills(lotId, div) {

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let passiveName = document.createElement("th");
    passiveName.innerText = jData.locale.luckySkills.passive_name_title;

    let passiveDescr = document.createElement("th");
    passiveDescr.innerText = jData.locale.luckySkills.passive_descr_title;

    let passiveDropRate = document.createElement("th");
    passiveDropRate.innerText = jData.locale.luckySkills.passive_drop_rate_title;

    tr.appendChild(passiveName);
    tr.appendChild(passiveDescr);
    tr.appendChild(passiveDropRate);
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    let lot = jData.proto.potentialLot.filter(pl => parseInt(pl.potentialLotId) === lotId);
    let lotFullRate = lot.reduce((acc, val) => acc + val.rate, 0);

    for(let i = 0; i < lot.length; i++) {
        let tr = document.createElement("tr");

        let passiveName = document.createElement("td");
        passiveName.innerText = getPassiveSkillName(lot[i].potentialId);

        let passiveDescr = document.createElement("td");
        passiveDescr.innerText = getPassiveSkillDescr(lot[i].potentialId);

        let passiveDropRate = document.createElement("td");
        passiveDropRate.innerText = `${Math.round(lot[i].rate / lotFullRate * 100)}%`;

        tr.appendChild(passiveName);
        tr.appendChild(passiveDescr);
        tr.appendChild(passiveDropRate);

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    div.appendChild(table);
}

function printLotInfos(lot) {
    passivesDiv.innerHTML = "";
    let div = document.createElement("div");
    div.id = `lot_${lot.lotId}`;
    div.style.scrollMarginTop = "5em";

    let h2 = document.createElement("h2");
    h2.innerText = jData.lsd.potentialItemName["540000000139"].replace("[Name:TrainerNameAndType ]", `[${jData.locale.common.role_name_standard[lot.role]}]`);
    div.appendChild(h2);

    printLotPassiveSkills(lot.lotId, div);

    let br = document.createElement("br");
    div.appendChild(br);

    let h3 = document.createElement("h3");
    h3.innerText = jData.locale.common.menu_sync_pairs;
    div.appendChild(h3);

    let ul = document.createElement("ul");
    ul.classList.add("listh-bipcode");
    div.appendChild(ul);

    let syncPairsList = jData.proto.potentialItem.filter(pi => pi.potentialLotId === lot.lotId).map(pi => { return { "trainerId": pi.trainerId, "name": getPairName(pi.trainerId)}; }).sort((a, b) => a.name.localeCompare(b.name));

    for(let i = 0; i < syncPairsList.length; i++) {
        let li = document.createElement("li");
        li.classList.add("listh-bipcode");
        if(window.location.hostname === "localhost") {
            li.innerHTML = `<b><a href="http://localhost:63342/Pokebip-com.github.io/masters/duo.html?pair=${syncPairsList[i].trainerId}">${syncPairsList[i].name}</a></b>`;
        }
        else {
            li.innerHTML = `<b><a href="${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${syncPairsList[i].trainerId}">${syncPairsList[i].name}</a></b>`;
        }
        ul.appendChild(li);
    }

    passivesDiv.appendChild(div);
}

function printCookieInfos(cookie) {
    passivesDiv.innerHTML = "";
    let div = document.createElement("div");
    div.id = `cookie_${cookie.itemId}`;
    div.style.scrollMarginTop = "5em";

    let h2 = document.createElement("h2");
    h2.innerText = getCookieName(cookie);
    div.appendChild(h2);

    printLotPassiveSkills(cookie.potentialLotId, div);

    passivesDiv.appendChild(div);
}

async function init() {
    cookieListDiv = document.getElementById("cookieListDiv");
    passivesDiv = document.getElementById("passivesDiv");
    //toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await getData();

    document.getElementById("pageTitle").innerText = jData.locale.common.submenu_lucky_skills;

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

    listLuckyCookiesInfos();

    if(window.location.hash !== "" && window.location.hash !== "#") {
        setTimeout(function () {
            let tmp = document.createElement("a");
            tmp.href = window.location.hash;
            tmp.click();
        }, 1000);
    }
}

init().then();
