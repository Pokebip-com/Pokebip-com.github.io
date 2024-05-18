let skillDeckItemConditionTeamSkillTagLot;
let skillDeckItemEffectLot;
let skillDeckItemSkillFeatherItem;
let teamSkill;

let skillDeckItemSkillFeatherItemName;
let teamSkillEffect;
let teamSkillTag;

let skillGearsLocale;

let skillGearsDiv;

async function getData() {
    const [
        skillDeckItemConditionTeamSkillTagLotResponse,
        skillDeckItemEffectLotResponse,
        skillDeckItemSkillFeatherItemResponse,
        teamSkillResponse,
        skillDeckItemSkillFeatherItemNameResponse,
        teamSkillEffectResponse,
        teamSkillTagResponse,
    ] = await Promise.all([
        fetch("./data/proto/SkillDeckItemConditionTeamSkillTagLot.json"),
        fetch("./data/proto/SkillDeckItemEffectLot.json"),
        fetch("./data/proto/SkillDeckItemSkillFeatherItem.json"),
        fetch("./data/proto/TeamSkill.json"),
        fetch(`./data/lsd/skill_deck_item_skill_feather_item_name_${lng}.json`),
        fetch(`./data/lsd/team_skill_effect_${lng}.json`),
        fetch(`./data/lsd/team_skill_tag_${lng}.json`),
    ])
        .catch(error => console.log(error));

    skillDeckItemConditionTeamSkillTagLot = await skillDeckItemConditionTeamSkillTagLotResponse.json();
    skillDeckItemConditionTeamSkillTagLot = skillDeckItemConditionTeamSkillTagLot.entries;

    skillDeckItemEffectLot = await skillDeckItemEffectLotResponse.json();
    skillDeckItemEffectLot = skillDeckItemEffectLot.entries;

    skillDeckItemSkillFeatherItem = await skillDeckItemSkillFeatherItemResponse.json();
    skillDeckItemSkillFeatherItem = skillDeckItemSkillFeatherItem.entries;

    skillDeckItemSkillFeatherItemName = await skillDeckItemSkillFeatherItemNameResponse.json();

    teamSkill = await teamSkillResponse.json();
    teamSkill = teamSkill.entries;
    teamSkillTag = await teamSkillTagResponse.json();
    teamSkillEffect = await teamSkillEffectResponse.json();
}

async function getCustomJSON() {
    const [
        skillGearsLocaleResponse
    ] = await Promise.all([
        fetch(`./data/locales/${lng}/skill-gears.json`),
    ])
        .catch(error => console.log(error));

    skillGearsLocale = await skillGearsLocaleResponse.json();
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

function listFeatherInfos() {

    let ul = document.createElement("ul");
    ul.classList.add("listh-bipcode");

    for(let i = 0; i < skillDeckItemSkillFeatherItem.length; i++) {
        let li = document.createElement("li");
        li.classList.add("listh-bipcode");
        li.style.width = "100px";
        li.appendChild(getFeatherItemImage(skillDeckItemSkillFeatherItem[i]));

        li.appendChild(document.createElement("br"));

        let link = document.createElement("a");
        link.href = `#feather_${skillDeckItemSkillFeatherItem[i].itemId}`;
        link.innerHTML = `<b>${skillDeckItemSkillFeatherItemName[skillDeckItemSkillFeatherItem[i].itemId]}</b>`;

        li.classList.add("listh-click");
        li.onclick = () => link.click();
        li.appendChild(link);

        ul.appendChild(li);
    }

    skillGearsDiv.appendChild(ul);

    for(let i = 0; i < skillDeckItemSkillFeatherItem.length; i++) {
        printFeatherInfos(skillDeckItemSkillFeatherItem[i]);
    }
}

function printFeatherTeamSkills(feather, div) {

    let h3 = document.createElement("h3");
    h3.innerText = skillGearsLocale.team_skills;
    div.appendChild(h3);

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

function printFeatherPassiveSkills(feather, div) {
    let h3 = document.createElement("h3");
    h3.innerText = skillGearsLocale.passive_skills;
    div.appendChild(h3);

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
    let div = document.createElement("div");
    div.id = `feather_${feather.itemId}`;
    div.style.scrollMarginTop = "5em";

    let h2 = document.createElement("h2");
    h2.innerText = skillDeckItemSkillFeatherItemName[feather.itemId];
    div.appendChild(h2);

    printFeatherTeamSkills(feather, div);
    printFeatherPassiveSkills(feather, div);

    skillGearsDiv.appendChild(div);
}

async function init() {
    skillGearsDiv = document.getElementById("skillGearsDiv");
    //toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await initMovePassiveSkills();
    await getData();
    await getCustomJSON();

    document.getElementById("pageTitle").innerText = commonLocales.adminsubmenu_skill_gear;

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
