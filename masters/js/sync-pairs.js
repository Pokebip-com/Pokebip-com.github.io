let abilityPanel;
let monster;
let monsterBase;
let monsterEvolution;
let monsterVariation;
let schedule;
let trainer;
let trainerBase;
let trainerExRole;
let versions;

let monsterDescriptions;
let monsterForms;
let monsterNames;
let motifTypeName;
let trainerDescriptions;
let trainerNames;
let trainerVerboseNames;

let syncPairSelect;
let syncPairDiv;
let toolsDiv;

async function getData() {
    const [
        abilityPanelResponse,
        monsterResponse,
        monsterBaseResponse,
        monsterEvolutionResponse,
        monsterVariationResponse,
        scheduleResponse,
        trainerResponse,
        trainerBaseResponse,
        trainerExRoleResponse,
        monsterDescriptionResponse,
        monsterFormResponse,
        monsterNameResponse,
        motifTypeNameResponse,
        trainerDescriptionResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,
    ] = await Promise.all([
        fetch("./data/proto/AbilityPanel.json"),
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/MonsterEvolution.json"),
        fetch("./data/proto/MonsterVariation.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch("./data/proto/TrainerExRole.json"),
        fetch("./data/lsd/monster_description_fr.json"),
        fetch("./data/lsd/monster_form_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/motif_type_name_fr.json"),
        fetch("./data/lsd/trainer_description_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json"),
        fetch("./data/lsd/trainer_verbose_name_fr.json")
    ])
        .catch(error => console.log(error));

    abilityPanel = await abilityPanelResponse.json();
    abilityPanel = abilityPanel.entries;

    schedule = await scheduleResponse.json();
    schedule = schedule.entries.filter(s => s.scheduleId.startsWith("chara_"));

    const monstersJSON = await monsterResponse.json();
    monster = monstersJSON.entries;

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = monstersBaseJSON.entries;

    const monsterEvolutionJSON = await monsterEvolutionResponse.json();
    monsterEvolution = monsterEvolutionJSON.entries;

    const monsterVariationJSON = await monsterVariationResponse.json();
    monsterVariation = monsterVariationJSON.entries;

    trainer = await trainerResponse.json();
    trainer = trainer.entries;

    const trainersBaseJSON = await trainerBaseResponse.json();
    trainerBase = trainersBaseJSON.entries;

    trainerExRole = await trainerExRoleResponse.json();
    trainerExRole = trainerExRole.entries;

    monsterDescriptions = await monsterDescriptionResponse.json();
    monsterForms = await monsterFormResponse.json();
    monsterNames = await monsterNameResponse.json();
    motifTypeName = await motifTypeNameResponse.json();
    trainerDescriptions = await trainerDescriptionResponse.json();
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();
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

function populateSelect() {
    while(syncPairSelect.length > 0) {
        syncPairSelect.remove(0);
    }
    let optionData = trainer.filter(t => t.scheduleId !== "NEVER_CHECK_DICTIONARY").map(t => {
        let data = {};
        data.value = t.trainerId;
        data.text = getPairName(t.trainerId);
        return data;
    }).sort((a, b) => a.text.localeCompare(b.text));

    optionData.forEach(opt => {
        syncPairSelect.add(new Option(opt.text, opt.value));
    });
}

function switchTab(monsterId, monsterBaseId, formId) {
    setUrlMonsterInfos(monsterId, monsterBaseId, formId);

    [...document.getElementsByClassName("tabContent")].forEach(tc => tc.style.display = "none");
    [...document.getElementsByClassName("tabLinks")].forEach(tl => tl.classList.remove("active"));
    document.getElementById(`${monsterId}-${monsterBaseId}-${formId}`).style.display = "block";
    document.getElementById(`btn-${monsterId}-${monsterBaseId}-${formId}`).classList.add("active");
}

function setPairOverview(contentDiv, monsterName, monsterId, monsterBaseId) {
    let table = document.createElement("table");
    let firstRow = document.createElement("tr");
    let trainerName = document.createElement("th");
    let pokemonName = document.createElement("th");

    table.classList.add("bipcode");
    table.style.textAlign = "center";
    table.style.maxWidth = "512px";

    trainerName.colSpan = 2;
    trainerName.innerText = getTrainerName(syncPairSelect.value);

    pokemonName.colSpan = 2;
    pokemonName.innerText = monsterName;

    firstRow.appendChild(trainerName);
    firstRow.appendChild(pokemonName);
    table.appendChild(firstRow);

    let secondRow = document.createElement("tr");

    let trainerActorId = getTrainerActorId(syncPairSelect.value);
    let trainerImageCell = document.createElement("td");
    let trainerImg = document.createElement("img");
    trainerImg.src = `./data/actor/Trainer/${trainerActorId}/${trainerActorId}_1024.png`;
    trainerImg.style.maxWidth = "256px";
    trainerImageCell.appendChild(trainerImg);

    let pokemonActorId = getMonsterActorIdFromBaseId(monsterBaseId);
    let pokemonImageCell = document.createElement("td");
    let pokemonImg = document.createElement("img");
    pokemonImg.src = `./data/actor/Monster/${pokemonActorId}/${pokemonActorId}_256.png`;

    pokemonImageCell.appendChild(pokemonImg);

    trainerImageCell.colSpan = 2;
    pokemonImageCell.colSpan = 2;
    secondRow.appendChild(trainerImageCell);
    secondRow.appendChild(pokemonImageCell);
    table.appendChild(secondRow);

    let exTitleRow, exImageRow;
    if(hasExUnlocked(syncPairSelect.value)) {
        pokemonImageCell.rowSpan = 3;

        exTitleRow = document.createElement("tr");
        let exTitle = document.createElement("th");
        exTitle.innerText = "Tenue 6★ EX";
        exTitle.colSpan = 2;
        exTitleRow.appendChild(exTitle);

        exImageRow = document.createElement("tr");
        let exImageCell = document.createElement("td");

        exImageCell.style.backgroundImage = `url("./data/actor/Trainer/${trainerActorId}/${trainerActorId}_mindscape00.png")`;
        exImageCell.style.backgroundPosition = "center";
        exImageCell.style.backgroundSize = "cover";
        exImageCell.style.backgroundRepeat = "no-repeat";
        exImageCell.colSpan = 2;

        let exImg = document.createElement("img");

        exImg.src = `./data/actor/Trainer/${trainerActorId}_01_expose/${trainerActorId}_01_expose_1024.png`;
        exImg.style.maxWidth = "256px";

        exImageCell.appendChild(exImg);
        exImageRow.appendChild(exImageCell);

        table.appendChild(exTitleRow);
        table.appendChild(exImageRow);
    }

    let infosTitleRow = document.createElement("tr");
    let roleTitle = document.createElement("th");
    roleTitle.innerText = "Rôle";

    let potentielTitle = document.createElement("th");
    potentielTitle.innerText = "Potentiel\n(Base)";

    let typeTitle = document.createElement("th");
    typeTitle.innerText = "Type";

    let weaknessTitle = document.createElement("th");
    weaknessTitle.innerText = "Faiblesse";

    infosTitleRow.appendChild(roleTitle);
    infosTitleRow.appendChild(potentielTitle);
    infosTitleRow.appendChild(typeTitle);
    infosTitleRow.appendChild(weaknessTitle);
    table.appendChild(infosTitleRow);

    let infosRow = document.createElement("tr");

    let roleCell = document.createElement("td");
    roleCell.innerText = getRoleByTrainerId(syncPairSelect.value);

    let potentielCell = document.createElement("td");
    potentielCell.innerHTML = getStarsRarityString(syncPairSelect.value);

    let typeCell = document.createElement("td");
    typeCell.innerText = getTrainerTypeName(syncPairSelect.value);

    let weaknessCell = document.createElement("td");
    weaknessCell.innerText = getTrainerWeaknessName(syncPairSelect.value);

    infosRow.appendChild(roleCell);
    infosRow.appendChild(potentielCell);
    infosRow.appendChild(typeCell);
    infosRow.appendChild(weaknessCell);
    table.appendChild(infosRow);

    let descrTitleRow = document.createElement("tr");
    let descrTitle = document.createElement("th");
    descrTitle.innerText = "Descriptions";
    descrTitle.colSpan = 4;
    descrTitleRow.appendChild(descrTitle);
    table.appendChild(descrTitleRow);

    let descrTrainerTxt = trainerDescriptions[syncPairSelect.value];

    if(descrTrainerTxt) {
        let descrTrainerRow = document.createElement("tr");
        let descrTrainer = document.createElement("td");
        descrTrainer.innerText = descrTrainerTxt.replaceAll("\n", " ");
        descrTrainer.colSpan = 4;
        descrTrainerRow.appendChild(descrTrainer);
        table.appendChild(descrTrainerRow);
    }

    let descrMonsterTxt = monsterDescriptions[monsterBaseId];

    if(descrMonsterTxt) {
        let descrMonsterRow = document.createElement("tr");
        let descrMonster = document.createElement("td");
        descrMonster.innerText = descrMonsterTxt.replaceAll("\n", " ");
        descrMonster.colSpan = 4;
        descrMonsterRow.appendChild(descrMonster);
        table.appendChild(descrMonsterRow);
    }

    contentDiv.appendChild(table);
}

function getStatRow(name, statValues, rarity, level, scale = 1) {
    const breakPointLevels = [1, 30, 45, 100, 120, 140, 200];

    let tr = document.createElement("tr");
    let th = document.createElement("th");
    th.innerText = name;

    tr.appendChild(th);

    let pointBIdx = breakPointLevels.findIndex((a) => a > level);
    let pointAIdx = pointBIdx - 1;

    for(let i = rarity; i <= 6; i++) {
        let statValue = statValues[pointAIdx] + (level - breakPointLevels[pointAIdx])*(statValues[pointBIdx] - statValues[pointAIdx])/(breakPointLevels[pointBIdx] - breakPointLevels[pointAIdx]);

        if(i < 6)
            statValue += 20*(i-rarity)*(name === "PV" ? 2 : 1);
        else
            statValue += 20*(i-rarity)*(name === "PV" ? 5 : 2);

        statValue = Math.trunc(statValue*scale);


        let td = document.createElement("td");

        if(scale > 1) {
            td.innerHTML = `<b style="color: green">${statValue}</b>`;
        }
        else if(scale < 1) {
            td.innerHTML = `<b style="color: darkred">${statValue}</b>`;
        }
        else {
            td.innerText = statValue;
        }

        tr.appendChild(td);
    }

    return tr;
}

function setStatsTable(input, statsDiv, monsterData, variation = null) {
    if(input.value === "")
        return;

    statsDiv.innerHTML = "";

    let rarity = getTrainerRarity(syncPairSelect.value);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");

    let statsMaxTh = document.createElement("th");
    statsMaxTh.innerText = "Stats max";
    headRow.appendChild(statsMaxTh);

    for(let i = rarity; i <= 6; i++) {
        let th = document.createElement("th");
        th.innerText = (i === 6 ? "5+★" : `${i}★`);
        headRow.appendChild(th);
    }

    table.appendChild(headRow);
    table.appendChild(getStatRow("PV", monsterData.hpValues, rarity, input.value));
    table.appendChild(getStatRow("Attaque", monsterData.atkValues, rarity, input.value, (variation ? variation.atkScale/100 : 1)));
    table.appendChild(getStatRow("Défense", monsterData.defValues, rarity, input.value, (variation ? variation.defScale/100 : 1)));
    table.appendChild(getStatRow("Atq. Spé.", monsterData.spaValues, rarity, input.value, (variation ? variation.spaScale/100 : 1)));
    table.appendChild(getStatRow("Déf. Spé.", monsterData.spdValues, rarity, input.value, (variation ? variation.spdScale/100 : 1)));
    table.appendChild(getStatRow("Vitesse", monsterData.speValues, rarity, input.value, (variation ? variation.speScale/100 : 1)));
    statsDiv.appendChild(table);
}

function setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {

    let monsterData = getMonsterById(monsterId);

    let defaultLevels = document.createElement("dataList");
    defaultLevels.id = "defaultLevels";
    defaultLevels.appendChild(new Option("", "1"));
    defaultLevels.appendChild(new Option("", "110"));
    defaultLevels.appendChild(new Option("", "120"));
    defaultLevels.appendChild(new Option("", "125"));
    defaultLevels.appendChild(new Option("", "130"));
    defaultLevels.appendChild(new Option("", "135"));
    defaultLevels.appendChild(new Option("", "140"));
    defaultLevels.appendChild(new Option("", "150"));

    let lvlInput = document.createElement("input");
    lvlInput.type = "number";
    lvlInput.value = "150";
    lvlInput.min = "1";
    lvlInput.max = "150";
    lvlInput.setAttribute("list", "defaultLevels");

    let statsDiv = document.createElement("div");
    statsDiv.id = "statsDiv";

    contentDiv.appendChild(defaultLevels);
    contentDiv.appendChild(lvlInput);
    contentDiv.appendChild(statsDiv);

    lvlInput.addEventListener("change", (e) => setStatsTable(e.currentTarget, statsDiv, monsterData, variation));
    setStatsTable(lvlInput, statsDiv, monsterData, variation);
}

function setTabContent(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {
    setPairOverview(contentDiv, monsterName, monsterId, monsterBaseId);
    setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation);
}

function createTab(monsterId, monTabs, tabContentDiv, isDefault = false, variation = null) {
    let monsterBaseId = 0;
    let formId = 0;
    let monsterName;

    if(variation) {
        formId = variation.formId;
        monsterBaseId = getMonsterBaseIdFromActorId(variation.actorId);
        monsterName = getNameByMonsterBaseId(monsterBaseId, formId);
    }
    else {
        monsterBaseId = getMonsterBaseIdFromMonsterId(monsterId);
        monsterName = getMonsterNameByMonsterId(monsterId);
    }

    let miBtn = document.createElement("button");
    miBtn.classList.add("tabLinks");
    miBtn.innerHTML = monsterName;
    miBtn.id = `btn-${monsterId}-${monsterBaseId}-${formId}`;
    miBtn.addEventListener("click", () => switchTab(monsterId, monsterBaseId, formId));
    monTabs.appendChild(miBtn);

    let contentDiv = document.createElement("div");
    contentDiv.id = `${monsterId}-${monsterBaseId}-${formId}`;
    contentDiv.classList.add("tabContent");

    setTabContent(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation);

    tabContentDiv.appendChild(contentDiv);

    if(isDefault) {
        switchTab(monsterId, monsterBaseId, formId);
    }
}

function setPairInfos(id) {
    let pairEvolutions = monsterEvolution.filter(me => me.trainerId === id);
    let monsterIds = [];
    let pairVariations = {};

    let title = document.createElement("h1");
    title.textContent = getPairName(id);

    syncPairDiv.innerHTML = "";
    syncPairDiv.appendChild(title);

    let monTabs = document.createElement("div");
    monTabs.classList.add("tab");
    syncPairDiv.appendChild(monTabs);

    let tabContentDiv = document.createElement("div");
    tabContentDiv.id = "tabContentDiv";
    syncPairDiv.appendChild(tabContentDiv);

    monsterIds.push(trainer.find(t => t.trainerId === id).monsterId);
    pairEvolutions.forEach(pe => monsterIds.push(pe.monsterIdNext));

    for(let i = 0; i < monsterIds.length; i++) {
        if(i === (monsterIds.length - 1)) {
            createTab(monsterIds[i], monTabs, tabContentDiv, true);
        }
        else {
            createTab(monsterIds[i], monTabs, tabContentDiv);
        }

        let variations = monsterVariation.filter(mv => mv.monsterId === monsterIds[i]);
        if(variations.length > 0) {
            pairVariations[monsterIds[i]] = variations;

            variations.forEach(v => {
                if(v.form !== 4)    // Ne pas inclure les Gigamax
                    createTab(monsterIds[i], monTabs, tabContentDiv, false, v)
            });
        }
    }
}

function setPair(id) {
    syncPairSelect.value = id;
    setPairInfos(id);
}

function setUrlMonsterInfos(monsterId, baseId, formId) {

    const url = new URL(window.location);

    if(url.searchParams.get('pair') !== syncPairSelect.value) {
        url.searchParams.set('pair', syncPairSelect.value);
    }

    url.searchParams.set('monsterId', monsterId);
    url.searchParams.set('baseId', baseId);
    url.searchParams.set('formId', formId);

    window.history.pushState(null, '', url.toString());
}

async function init() {
    syncPairSelect = document.getElementById("syncPairSelect");
    syncPairDiv = document.getElementById("syncPairDiv");
    toolsDiv = document.getElementById('adminTools');

    await getData();
    await getCustomJSON();

    if(isAdminMode) {
        toolsDiv.style.display = "table";

        downloadButton = document.getElementById("downloadData");
        downloadButton.onclick = downloadData;
    }

    populateSelect()

    syncPairSelect.onchange = function() {
        url.searchParams.delete('monsterId');
        url.searchParams.delete('baseId');
        url.searchParams.delete('formId');

        setPair(syncPairSelect.value);
    };

    const url = new URL(window.location);
    const urlPairId = url.searchParams.get('pair');

    if(urlPairId !== null) {
        syncPairSelect.value = urlPairId;
    }

    setPairInfos(syncPairSelect.value);

    const monsterId = url.searchParams.get('monsterId');
    const baseId = url.searchParams.get('baseId');
    const formId = url.searchParams.get('formId');

    if(monsterId && baseId && formId) {
        switchTab(monsterId, baseId, formId);
    }
}

init().then();
