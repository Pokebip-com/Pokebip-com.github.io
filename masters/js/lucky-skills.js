let potential;
let potentialItem;
let potentialLot;

let potentialItemName;

let storyQuest;
let itemExchange;
let itemSet;
let progressEvent;
let progressEventRewardGroup;
let schedule;

let versions;

let luckySkillLocale;

let cookieListDiv;
let passivesDiv;


async function getData() {
    const [
        itemExchangeResponse,
        itemSetResponse,
        potentialResponse,
        potentialItemResponse,
        potentialLotResponse,
        progressEventResponse,
        progressEventRewardGroupResponse,
        scheduleResponse,
        storyQuestResponse,
        potentialItemNameResponse
    ] = await Promise.all([
        fetch("./data/proto/ItemExchange.json"),
        fetch("./data/proto/itemSet.json"),
        fetch("./data/proto/Potential.json"),
        fetch("./data/proto/PotentialItem.json"),
        fetch("./data/proto/PotentialLot.json"),
        fetch("./data/proto/ProgressEvent.json"),
        fetch("./data/proto/ProgressEventRewardGroup.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/StoryQuest.json"),
        fetch(`./data/lsd/potential_item_name_${lng}.json`),
    ])
        .catch(error => console.log(error));

    itemExchange = (await itemExchangeResponse.json()).entries;
    itemSet = (await itemSetResponse.json()).entries;

    potential = (await potentialResponse.json()).entries;
    potentialItem = (await potentialItemResponse.json()).entries;
    potentialLot = (await potentialLotResponse.json()).entries;

    progressEvent = (await progressEventResponse.json()).entries;
    progressEventRewardGroup = (await progressEventRewardGroupResponse.json()).entries;

    schedule = (await scheduleResponse.json()).entries;

    storyQuest = (await storyQuestResponse.json()).entries;

    potentialItemName = await potentialItemNameResponse.json();
}

async function getCustomJSON() {
    const [
        luckySkillLocaleResponse,
        versionsResponse
    ] = await Promise.all([
        fetch(`./data/locales/${lng}/lucky-skills.json`),
        fetch(`./data/custom/version_release_dates.json`),
    ])
        .catch(error => console.log(error));

    luckySkillLocale = await luckySkillLocaleResponse.json();
    versions = await versionsResponse.json().then(orderByVersion);
}

function getProgressEventRewardCookies(cookiesList, lastVersionScheduleStarts) {
    let itemSetIds = itemSet.filter(is => cookiesList.includes(is.item1)).map(is => is.itemSetId);
    let progressEventEQGIds = progressEvent.map(pe => pe.questGroupId);
    let lastVersionQuestGroups = storyQuest.filter(sq => lastVersionScheduleStarts.includes(sq.scheduleId) && progressEventEQGIds.includes(sq.questGroupId)).map(sq => sq.questGroupId);

    return progressEventRewardGroup.filter(perg => lastVersionQuestGroups.includes(perg.progressEventId) && itemSetIds.includes(perg.itemSetId)).map(perg => itemSet.find(is => is.itemSetId === perg.itemSetId).item1);
}

function getNewCookies() {
    let cookiesList = [...new Set(potentialItem.filter(pi => pi.potentialLotId >= 6000).map(pi => pi.itemId))];
    let lastVersionScheduleStarts = [...new Set(schedule.filter(s => s.startDate >= versions[0].releaseTimestamp).map(s => s.scheduleId))];
    let cookieIds = itemExchange.filter(ie => cookiesList.includes(ie.itemId) && lastVersionScheduleStarts.includes(ie.scheduleId)).map(ie => ie.itemId);

   cookieIds.push(...getProgressEventRewardCookies(cookiesList, lastVersionScheduleStarts));

    return potentialItem.filter(pi => cookieIds.includes(pi.itemId));
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
    link.innerHTML = `<b>${potentialItemName[cookie.itemId]}</b>`;

    newLi.classList.add("listh-click");
    newLi.onclick = () => link.click();
    newLi.appendChild(link);

    return newLi;
}

function listLuckyCookiesInfos() {

    let newCookies = getNewCookies();

    let normalCookies = potentialItem.filter(pi => pi.rarity < 9);
    let guaranteedCookies = potentialItem.filter(pi => pi.rarity === 9 && pi.u2 !== "1");
    let trainerCookies = potentialItem.filter(pi => pi.rarity === 9 && pi.u2 === "1");

    if(newCookies.length > 0) {

        let newCookiesH2 = document.createElement("h2");
        newCookiesH2.innerText = luckySkillLocale.new_cookies;
        cookieListDiv.appendChild(newCookiesH2);

        let newUl = document.createElement("ul");
        newUl.classList.add("listh-bipcode");

        for(let i = 0; i < newCookies.length; i++) {
            newUl.appendChild(getCookieLi(newCookies[i]));
        }

        cookieListDiv.appendChild(newUl);
    }

    let normalCookiesH2 = document.createElement("h2");
    normalCookiesH2.innerText = luckySkillLocale.normal_cookies;

    let normalUl = document.createElement("ul");
    normalUl.classList.add("listh-bipcode");

    for(let i = 0; i < normalCookies.length; i++) {
        normalUl.appendChild(getCookieLi(normalCookies[i]));
    }

    let guaranteedCookiesH2 = document.createElement("h2");
    guaranteedCookiesH2.innerText = luckySkillLocale.guaranteed_cookies;

    let guaranteedUl = document.createElement("ul");
    guaranteedUl.classList.add("listh-bipcode");

    for(let i = 0; i < guaranteedCookies.length; i++) {
        guaranteedUl.appendChild(getCookieLi(guaranteedCookies[i]));
    }

    let trainerCookiesH2 = document.createElement("h2");
    trainerCookiesH2.innerText = luckySkillLocale.trainer_cookies;

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
    passiveName.innerText = luckySkillLocale.passive_name_title;

    let passiveDescr = document.createElement("th");
    passiveDescr.innerText = luckySkillLocale.passive_descr_title;

    let passiveDropRate = document.createElement("th");
    passiveDropRate.innerText = luckySkillLocale.passive_drop_rate_title;

    tr.appendChild(passiveName);
    tr.appendChild(passiveDescr);
    tr.appendChild(passiveDropRate);
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    let lot = potentialLot.filter(pl => parseInt(pl.potentialLotId) === cookie.potentialLotId);
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
    h2.innerText = potentialItemName[cookie.itemId];
    div.appendChild(h2);

    printCookiePassiveSkills(cookie, div);

    passivesDiv.appendChild(div);
}

async function init() {
    cookieListDiv = document.getElementById("cookieListDiv");
    passivesDiv = document.getElementById("passivesDiv");
    //toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await initMovePassiveSkills();
    await getData();
    await getCustomJSON();

    document.getElementById("pageTitle").innerText = commonLocales.submenu_lucky_skills;

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

function downloadData() {
    let e = document.createElement('a');
    e.href = window.URL.createObjectURL(
        new Blob([getPairBipCode(syncPairSelect.value)], { "type": "text/plain" })
    );
    e.setAttribute('download', removeAccents(getPairName(syncPairSelect.value)));
    e.style.display = 'none';

    document.body.appendChild(e);
    e.click();
    document.body.removeChild(e);
}

function downloadAll() {
    let zip = new JSZip();
    let trainerIds = trainer.filter(t => t.scheduleId !== "NEVER_CHECK_DICTIONARY" && t.scheduleId !== "NEVER")
        .map(t => t.trainerId);

    trainerIds.forEach(tid => {
        let filename = removeAccents(getPairName(tid)).replace("/", "-") + '.txt';
        zip.file(filename, getPairBipCode(tid));
    });

    zip.generateAsync({ type: 'blob' })
        .then(function(content) {
            saveAs(content, "Team-Skills.zip");
        });
}

init().then();
