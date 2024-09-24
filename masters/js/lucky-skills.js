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
    let img = document.createElement("img");
    img.style.backgroundImage = `url(./data/item/Frame/128/if01_0${cookie.rarity}_128.png)`;
    img.style.backgroundSize = "64px 64px";

    img.src = `./data/item/${cookie.imageId}/${cookie.imageId}_128.png`;
    img.style.width = "64px";
    img.style.height = "64px";
    return img;
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
    link.innerHTML = `<b>${jData.lsd.potentialItemName[cookie.itemId]}</b>`;

    newLi.classList.add("listh-click");
    newLi.onclick = () => link.click();
    newLi.appendChild(link);

    return newLi;
}

function listLuckyCookiesInfos() {

    let newCookies = getNewCookies();

    let normalCookies = jData.proto.potentialItem.filter(pi => pi.rarity < 9);
    let guaranteedCookies = jData.proto.potentialItem.filter(pi => pi.rarity === 9 && pi.u2 !== "1");
    let trainerCookies = jData.proto.potentialItem.filter(pi => pi.rarity === 9 && pi.u2 === "1");

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

    cookieListDiv.appendChild(guaranteedCookiesH2);
    cookieListDiv.appendChild(guaranteedUl);
    cookieListDiv.appendChild(trainerCookiesH2);
    cookieListDiv.appendChild(trainerUl);
    cookieListDiv.appendChild(normalCookiesH2);
    cookieListDiv.appendChild(normalUl);

    printCookieInfos(newCookies[0]);
}

function printCookiePassiveSkills(cookie, div) {

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

    let lot = jData.proto.potentialLot.filter(pl => parseInt(pl.potentialLotId) === cookie.potentialLotId);
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

function printCookieInfos(cookie) {
    passivesDiv.innerHTML = "";
    let div = document.createElement("div");
    div.id = `cookie_${cookie.itemId}`;
    div.style.scrollMarginTop = "5em";

    let h2 = document.createElement("h2");
    h2.innerText = jData.lsd.potentialItemName[cookie.itemId];
    div.appendChild(h2);

    printCookiePassiveSkills(cookie, div);

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
