let ability;
let abilityPanel;
let exRoleStatusUp;
let monster;
let monsterBase;
let monsterEvolution;
let monsterVariation;
let schedule;
let teamSkill;
let trainer;
let trainerBase;
let trainerExRole;

let abilityName;
let abilityType;
let abilityTypeBGColor;
let abilityTypeTitle;
let versions;

let monsterDescriptions;
let monsterForms;
let monsterNames;
let motifTypeName;
let teamSkillEffect;
let teamSkillTag;
let trainerDescriptions;
let trainerNames;
let trainerVerboseNames;

let dataArea;
let lastReleasePairsDiv;
let syncPairSelect;
let syncPairDiv;
let toolsDiv;

async function getData() {
    const [
        abilityResponse,
        abilityPanelResponse,
        exRoleStatusUpResponse,
        monsterResponse,
        monsterBaseResponse,
        monsterEvolutionResponse,
        monsterVariationResponse,
        scheduleResponse,
        teamSkillResponse,
        trainerResponse,
        trainerBaseResponse,
        trainerExRoleResponse,
        versionResponse,
        monsterDescriptionResponse,
        monsterFormResponse,
        monsterNameResponse,
        motifTypeNameResponse,
        teamSkillEffectResponse,
        teamSkillTagResponse,
        trainerDescriptionResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,
    ] = await Promise.all([
        fetch("./data/proto/Ability.json"),
        fetch("./data/proto/AbilityPanel.json"),
        fetch("./data/proto/ExRoleStatusUp.json"),
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/MonsterEvolution.json"),
        fetch("./data/proto/MonsterVariation.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/TeamSkill.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch("./data/proto/TrainerExRole.json"),
        fetch("./data/custom/version_release_dates.json"),
        fetch("./data/lsd/monster_description_fr.json"),
        fetch("./data/lsd/monster_form_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/motif_type_name_fr.json"),
        fetch("./data/lsd/team_skill_effect_fr.json"),
        fetch("./data/lsd/team_skill_tag_fr.json"),
        fetch("./data/lsd/trainer_description_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json"),
        fetch("./data/lsd/trainer_verbose_name_fr.json")
    ])
        .catch(error => console.log(error));

    ability = await abilityResponse.json();
    ability = ability.entries;

    abilityPanel = await abilityPanelResponse.json();
    abilityPanel = abilityPanel.entries;

    exRoleStatusUp = await exRoleStatusUpResponse.json();
    exRoleStatusUp = exRoleStatusUp.entries;

    versions = await versionResponse.json().then(orderByVersion);

    schedule = await scheduleResponse.json();
    schedule = schedule.entries.filter(s => s.scheduleId.startsWith("chara_") && s.startDate >= versions[0].releaseTimestamp);

    const monstersJSON = await monsterResponse.json();
    monster = monstersJSON.entries;

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = monstersBaseJSON.entries;

    const monsterEvolutionJSON = await monsterEvolutionResponse.json();
    monsterEvolution = monsterEvolutionJSON.entries;

    const monsterVariationJSON = await monsterVariationResponse.json();
    monsterVariation = monsterVariationJSON.entries;

    teamSkill = await teamSkillResponse.json();
    teamSkill = teamSkill.entries;

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
    teamSkillTag = await teamSkillTagResponse.json();
    teamSkillEffect = await teamSkillEffectResponse.json();
    trainerDescriptions = await trainerDescriptionResponse.json();
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();
}

async function getCustomJSON() {
    const [
        abilityNameResponse,
        abilityTypeResponse,
        abilityTypeBGColorResponse,
        abilityTypeTitleResponse,
        versionsResponse,
    ] = await Promise.all([
        fetch("./data/custom/ability_name.json"),
        fetch("./data/custom/ability_type.json"),
        fetch("./data/custom/table_bgcolor.json"),
        fetch("./data/custom/ability_type_title.json"),
        fetch("./data/custom/version_release_dates.json"),
    ])
        .catch(error => console.log(error));


    abilityName = await abilityNameResponse.json();
    abilityType = await abilityTypeResponse.json();
    abilityTypeBGColor = await abilityTypeBGColorResponse.json();
    abilityTypeTitle = await abilityTypeTitleResponse.json();
    versions = await versionsResponse.json().then(orderByVersion);
}

function populateSelect() {
    while(syncPairSelect.length > 0) {
        syncPairSelect.remove(0);
    }
    let optionData = trainer.filter(t => t.scheduleId !== "NEVER_CHECK_DICTIONARY" && t.scheduleId !== "NEVER").map(t => {
        let data = {};
        data.value = t.trainerId;
        data.text = getPairName(t.trainerId);
        return data;
    }).sort((a, b) => a.text.localeCompare(b.text));

    optionData.forEach(opt => {
        syncPairSelect.add(new Option(opt.text, opt.value));
    });
}

function switchTab(monsterId, monsterBaseId, formId, pushstate = true) {
    setUrlMonsterInfos(monsterId, monsterBaseId, formId, pushstate);

    [...document.getElementsByClassName("tabContent")].forEach(tc => tc.style.display = "none");
    [...document.getElementsByClassName("tabLinks")].forEach(tl => tl.classList.remove("active"));
    document.getElementById(`${monsterId}-${monsterBaseId}-${formId}`).style.display = "block";
    document.getElementById(`btn-${monsterId}-${monsterBaseId}-${formId}`).classList.add("active");
}

function setPairOverview(contentDiv, monsterName, monsterId, monsterBaseId, variation = null) {
    let table = document.createElement("table");
    let firstRow = document.createElement("tr");
    let trainerName = document.createElement("th");
    let pokemonName = document.createElement("th");

    table.classList.add("bipcode");
    table.style.textAlign = "center";
    table.style.maxWidth = "512px";

    trainerName.colSpan = 5;
    trainerName.innerText = getTrainerName(syncPairSelect.value);

    pokemonName.colSpan = 5;
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

    trainerImageCell.colSpan = 5;
    pokemonImageCell.colSpan = 5;
    secondRow.appendChild(trainerImageCell);
    secondRow.appendChild(pokemonImageCell);
    table.appendChild(secondRow);

    let exTitleRow, exImageRow;
    if(hasExUnlocked(syncPairSelect.value)) {
        pokemonImageCell.rowSpan = 3;

        exTitleRow = document.createElement("tr");
        let exTitle = document.createElement("th");
        exTitle.innerText = "Tenue 6★ EX";
        exTitle.colSpan = 5;
        exTitleRow.appendChild(exTitle);

        exImageRow = document.createElement("tr");
        let exImageCell = document.createElement("td");

        exImageCell.style.backgroundImage = `url("./data/actor/Trainer/${trainerActorId}/${trainerActorId}_mindscape00.png")`;
        exImageCell.style.backgroundPosition = "center";
        exImageCell.style.backgroundSize = "cover";
        exImageCell.style.backgroundRepeat = "no-repeat";
        exImageCell.colSpan = 5;

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
    roleTitle.colSpan = 2;

    let exRoleTitle = document.createElement("th");
    exRoleTitle.innerText = "Rôle EX";
    exRoleTitle.colSpan = 2;

    let potentielTitle = document.createElement("th");
    potentielTitle.innerText = "Potentiel\n(Base)";
    potentielTitle.colSpan = 2;

    let typeTitle = document.createElement("th");
    typeTitle.innerText = "Type";
    typeTitle.colSpan = 2;

    let weaknessTitle = document.createElement("th");
    weaknessTitle.innerText = "Faiblesse";
    weaknessTitle.colSpan = 2;

    infosTitleRow.appendChild(roleTitle);
    infosTitleRow.appendChild(exRoleTitle);
    infosTitleRow.appendChild(potentielTitle);
    infosTitleRow.appendChild(typeTitle);
    infosTitleRow.appendChild(weaknessTitle);
    table.appendChild(infosTitleRow);

    let infosRow = document.createElement("tr");

    let roleCell = document.createElement("td");
    roleCell.innerText = getRoleByTrainerId(syncPairSelect.value);
    roleCell.colSpan = 2;

    let exRoleCell = document.createElement("td");
    exRoleCell.innerText = getExRoleText(syncPairSelect.value);
    exRoleCell.colSpan = 2;

    let potentielCell = document.createElement("td");
    potentielCell.innerHTML = getStarsRarityString(syncPairSelect.value);
    potentielCell.colSpan = 2;

    let typeCell = document.createElement("td");
    typeCell.innerText = variation && variation.type > 0 ? motifTypeName[variation.type] : getTrainerTypeName(syncPairSelect.value);
    typeCell.colSpan = 2;

    let weaknessCell = document.createElement("td");
    weaknessCell.innerText = variation && variation.weakness > 0 ? motifTypeName[variation.weakness] : getTrainerWeaknessName(syncPairSelect.value);
    weaknessCell.colSpan = 2;

    infosRow.appendChild(roleCell);
    infosRow.appendChild(exRoleCell);
    infosRow.appendChild(potentielCell);
    infosRow.appendChild(typeCell);
    infosRow.appendChild(weaknessCell);
    table.appendChild(infosRow);

    let descrTitleRow = document.createElement("tr");
    let descrTitle = document.createElement("th");
    descrTitle.innerText = "Descriptions";
    descrTitle.colSpan = 10;
    descrTitleRow.appendChild(descrTitle);
    table.appendChild(descrTitleRow);

    let descrTrainerTxt = trainerDescriptions[syncPairSelect.value];

    if(descrTrainerTxt) {
        let descrTrainerRow = document.createElement("tr");
        let descrTrainer = document.createElement("td");
        descrTrainer.innerText = descrTrainerTxt.replaceAll("\n", " ");
        descrTrainer.colSpan = 10;
        descrTrainerRow.appendChild(descrTrainer);
        table.appendChild(descrTrainerRow);
    }

    let descrMonsterTxt = monsterDescriptions[monsterBaseId];

    if(descrMonsterTxt) {
        let descrMonsterRow = document.createElement("tr");
        let descrMonster = document.createElement("td");
        descrMonster.innerText = descrMonsterTxt.replaceAll("\n", " ");
        descrMonster.colSpan = 10;
        descrMonsterRow.appendChild(descrMonster);
        table.appendChild(descrMonsterRow);
    }

    contentDiv.appendChild(table);
}

function getStatRow(name, statValues, rarity, level, exRoleBonus, scale = 1) {
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

        statValue += exRoleBonus;

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

function setStatsTable(input, statsDiv, monsterData, variation = null, hasExRole = false) {
    if(input.value === "")
        return;

    statsDiv.innerHTML = "";

    let rarity = getTrainerRarity(syncPairSelect.value);
    let exRoleCheckbox = document.getElementById("exRoleCheckbox");
    let exRoleStats = hasExRole && exRoleCheckbox && exRoleCheckbox.checked;

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

    let exRoleBonus = {"hp" : 0, "atk": 0, "spa": 0, "def": 0, "spd": 0, "spe": 0 };

    if(exRoleStats) {
        exRoleBonus = exRoleStatusUp.find(ersu => ersu.roleId === getExRoleId(syncPairSelect.value));
    }

    table.appendChild(headRow);
    table.appendChild(getStatRow("PV", monsterData.hpValues, rarity, input.value, exRoleBonus.hp));
    table.appendChild(getStatRow("Attaque", monsterData.atkValues, rarity, input.value, exRoleBonus.atk, (variation ? variation.atkScale/100 : 1)));
    table.appendChild(getStatRow("Défense", monsterData.defValues, rarity, input.value, exRoleBonus.def, (variation ? variation.defScale/100 : 1)));
    table.appendChild(getStatRow("Atq. Spé.", monsterData.spaValues, rarity, input.value, exRoleBonus.spa, (variation ? variation.spaScale/100 : 1)));
    table.appendChild(getStatRow("Déf. Spé.", monsterData.spdValues, rarity, input.value, exRoleBonus.spd, (variation ? variation.spdScale/100 : 1)));
    table.appendChild(getStatRow("Vitesse", monsterData.speValues, rarity, input.value, exRoleBonus.spe, (variation ? variation.speScale/100 : 1)));
    statsDiv.appendChild(table);
}

function setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {

    let monsterData = getMonsterById(monsterId);

    let statsH2 = document.createElement("h2");
    statsH2.innerText = "Statistiques";
    contentDiv.appendChild(statsH2);

    let statContainer = document.createElement("div");
    statContainer.style.textAlign = "center";

    let toolFieldset = document.createElement("fieldset");
    toolFieldset.style.width = "fit-content";
    toolFieldset.style.borderRadius = "8px";
    toolFieldset.style.lineHeight = "1.6rem";
    toolFieldset.style.display = "inline-block";
    toolFieldset.style.verticalAlign = "middle";
    toolFieldset.style.margin = "5px";
    toolFieldset.innerHTML = "<legend><b>Options</b></legend>"

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
    toolFieldset.appendChild(defaultLevels);

    let lvlP = document.createElement("p");
    lvlP.style.display = "table-row";

    let lvlLabel = document.createElement("label");
    lvlLabel.setAttribute("for", "levelInput");
    lvlLabel.innerHTML = "<b>Niveau : </b>";
    lvlLabel.style.display = "table-cell";
    lvlLabel.style.textAlign = "right";
    lvlP.appendChild(lvlLabel);

    let lvlInput = document.createElement("input");
    lvlInput.type = "number";
    lvlInput.value = "150";
    lvlInput.min = "1";
    lvlInput.max = "150";
    lvlInput.id = "levelInput";
    lvlInput.style.display = "table-cell";
    lvlInput.style.marginLeft = "5px";
    lvlInput.setAttribute("list", "defaultLevels");
    lvlP.appendChild(lvlInput);
    toolFieldset.appendChild(lvlP);

    if(hasExRoleUnlocked(syncPairSelect.value)) {
        let exRoleP = document.createElement("p");
        exRoleP.style.display = "table-row";

        let exRoleLabel = document.createElement("label");
        exRoleLabel.setAttribute("for", "exRoleCheckbox");
        exRoleLabel.style.display = "table-cell";
        exRoleLabel.style.textAlign = "right";
        exRoleLabel.innerHTML = "<b>Rôle Ex débloqué : </b>";
        exRoleP.appendChild(exRoleLabel)


        let exRoleCheckbox = document.createElement("input");
        exRoleCheckbox.type = "checkbox";
        exRoleCheckbox.id = "exRoleCheckbox";
        exRoleCheckbox.style.display = "table-cell";
        exRoleCheckbox.style.marginLeft = "5px";
        exRoleCheckbox.addEventListener("change", (e) => setStatsTable(lvlInput, statsDiv, monsterData, variation, hasExRoleUnlocked(syncPairSelect.value)));
        exRoleP.appendChild(exRoleCheckbox)
        toolFieldset.appendChild(exRoleP);
    }

    let statsDiv = document.createElement("div");
    statsDiv.id = "statsDiv";
    statsDiv.style.display = "inline-block";
    statsDiv.style.verticalAlign = "middle";
    statsDiv.style.margin = "5px";

    statContainer.appendChild(toolFieldset);
    statContainer.appendChild(statsDiv);
    contentDiv.appendChild(statContainer)

    lvlInput.addEventListener("change", (e) => setStatsTable(e.currentTarget, statsDiv, monsterData, variation, hasExRoleUnlocked(syncPairSelect.value)));
    setStatsTable(lvlInput, statsDiv, monsterData, variation);
}

function setPairPassives(contentDiv, variation = null) {
    let tr = trainer.find(t => t.trainerId === syncPairSelect.value);

    let skillsH2 = document.createElement("h2");
    skillsH2.innerText = "Talents";
    contentDiv.appendChild(skillsH2);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");
    let headTitle = document.createElement("th");
    headTitle.colSpan = 2;
    headTitle.innerText = "Talents passifs";
    headRow.appendChild(headTitle);
    table.appendChild(headRow);

    let titleRow = document.createElement("tr");
    let nameTitle = document.createElement("th");
    nameTitle.innerText = "Nom";
    titleRow.appendChild(nameTitle);

    let descrTitle = document.createElement("th");
    descrTitle.innerText = "Description";
    titleRow.appendChild(descrTitle);

    table.appendChild(titleRow);

    for(let i = 1; i <= 4; i++) {
        const passiveId = variation && variation[`passive${i}Id`] > 0 ? variation[`passive${i}Id`] : tr[`passive${i}Id`];

        if(passiveId === 0)
            continue;

        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = getPassiveSkillName(passiveId);
        row.appendChild(nameCell);

        let descrCell = document.createElement("td");
        descrCell.innerText = getPassiveSkillDescr(passiveId);
        row.appendChild(descrCell);

        table.appendChild(row);
    }

    contentDiv.appendChild(table);
}

function setPairTeamSkills(contentDiv) {
    let tr = trainer.find(t => t.trainerId === syncPairSelect.value);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let titleRow = document.createElement("tr");
    let titleCell = document.createElement("th");
    titleCell.innerText = "Talents d'équipe";

    let row = document.createElement("tr");

    for(let i = 1; i <= 5; i++) {
        let ts = teamSkill.find(tsk => tsk.teamSkillId == tr[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 1);

        if(!ts)
            continue;

        let td = document.createElement("td");
        td.innerText = teamSkillTag[ts.teamSkillPropValue];
        row.appendChild(td);

        titleCell.colSpan++;
    }

    titleRow.appendChild(titleCell);
    table.appendChild(titleRow);
    table.appendChild(row);

    contentDiv.appendChild(document.createElement("br"));
    contentDiv.appendChild(table);
}

function getMoveRow(moveId) {
    let mov = move.find(m => m.moveId == moveId);

    let tr = document.createElement("tr");

    let nameCell = document.createElement("td");
    nameCell.innerText = moveNames[moveId];
    tr.appendChild(nameCell);

    let typeCell = document.createElement("td");
    typeCell.innerText = motifTypeName[mov.type];
    tr.appendChild(typeCell);

    let categoryCell = document.createElement("td");
    categoryCell.innerText = categoryToFR[mov.category];
    tr.appendChild(categoryCell);

    let powerCell = document.createElement("td");
    powerCell.innerText = mov.power || "–";
    tr.appendChild(powerCell);

    let accuracyCell = document.createElement("td");
    accuracyCell.innerText = mov.accuracy || "–";
    tr.appendChild(accuracyCell);

    let gaugeCell = document.createElement("td");
    gaugeCell.innerText = mov.gaugeDrain || "–";
    tr.appendChild(gaugeCell);

    let targetCell = document.createElement("td");
    targetCell.innerText = moveTargetType[targetToId[mov.target]] || "–";
    tr.appendChild(targetCell);

    let descrCell = document.createElement("td");
    descrCell.innerText = getMoveDescr(moveId);
    tr.appendChild(descrCell);

    let limitCell = document.createElement("td");
    limitCell.innerText = mov.uses || "–";
    tr.appendChild(limitCell);

    return tr;
}

function getGMaxMoveRow(moveId) {
    let mov = move.find(m => m.moveId == moveId);

    let tr = document.createElement("tr");

    let nameCell = document.createElement("td");
    nameCell.innerText = moveNames[moveId];
    tr.appendChild(nameCell);

    let typeCell = document.createElement("td");
    typeCell.innerText = motifTypeName[mov.type];
    tr.appendChild(typeCell);

    let categoryCell = document.createElement("td");
    categoryCell.innerText = categoryToFR[mov.category];
    tr.appendChild(categoryCell);

    let powerCell = document.createElement("td");
    powerCell.innerText = mov.power || "–";
    tr.appendChild(powerCell);

    let targetCell = document.createElement("td");
    targetCell.innerText = moveTargetType[targetToId[mov.target]] || "–";
    tr.appendChild(targetCell);

    let descrCell = document.createElement("td");
    descrCell.innerText = getMoveDescr(moveId);
    tr.appendChild(descrCell);

    return tr;
}

function getSyncMoveRow(syncMoveId, tr) {
    let row = document.createElement("tr");
    let mov = move.find(m => m.moveId === syncMoveId);

    let nameCell = document.createElement("td");
    nameCell.innerText = moveNames[syncMoveId];
    row.appendChild(nameCell);

    let typeCell = document.createElement("td");
    typeCell.innerText = motifTypeName[mov.type];
    row.appendChild(typeCell);

    let categoryCell = document.createElement("td");
    categoryCell.innerText = categoryToFR[mov.category];
    row.appendChild(categoryCell);

    let powerCell = document.createElement("td");
    powerCell.innerText = mov.power || "–";
    row.appendChild(powerCell);

    let effectCell = document.createElement("td");
    effectCell.innerText = getMoveDescr(syncMoveId);
    row.appendChild(effectCell);

    if(hasExUnlocked(tr.trainerId)) {
        let exEffectCell = document.createElement("td");
        exEffectCell.innerText = exSyncEffect[tr.role];
        row.appendChild(exEffectCell);
    }

    if(hasExRoleUnlocked(tr.trainerId)) {
        let exRoleEffectCell = document.createElement("td");
        exRoleEffectCell.innerText = exSyncEffect[getExRoleId(tr.trainerId)];
        row.appendChild(exRoleEffectCell);
    }

    return row;
}

function setPairMoves(contentDiv, monsterId, variation = null) {
    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let movesH2 = document.createElement("h2");
    movesH2.innerText = "Capacités";
    contentDiv.appendChild(movesH2);

    let headRow = document.createElement("tr");
    let headTitle = document.createElement("th");
    headTitle.innerText = "Capacités";
    headTitle.colSpan = 9;
    headRow.appendChild(headTitle);
    table.appendChild(headRow);

    let titleRow = document.createElement("tr");

    let titleName = document.createElement("th");
    titleName.innerText = "Nom";
    titleRow.appendChild(titleName);

    let titleType = document.createElement("th");
    titleType.innerText = "Type";
    titleRow.appendChild(titleType);

    let titleCategory = document.createElement("th");
    titleCategory.innerText = "Catégorie";
    titleRow.appendChild(titleCategory);

    let titlePower = document.createElement("th");
    titlePower.innerText = "Puissance";
    titleRow.appendChild(titlePower);

    let titleAccuracy = document.createElement("th");
    titleAccuracy.innerText = "Précision";
    titleRow.appendChild(titleAccuracy);

    let titleGauge = document.createElement("th");
    titleGauge.innerText = "Jauge";
    titleRow.appendChild(titleGauge);

    let titleTarget = document.createElement("th");
    titleTarget.innerText = "Cible";
    titleRow.appendChild(titleTarget);

    let titleEffect = document.createElement("th");
    titleEffect.innerText = "Effet";
    titleRow.appendChild(titleEffect);

    let titleLimit = document.createElement("th");
    titleLimit.innerText = "Limite";
    titleRow.appendChild(titleLimit);

    table.appendChild(titleRow);

    let tr = trainer.find(t => t.trainerId === syncPairSelect.value);
    let mon = monster.find(m => m.monsterId === monsterId);

    for(let i = 1; i < 5; i++) {
        let moveId;

        if(variation && variation[`move${i}Id`] > -1) {
            moveId = variation[`move${i}Id`]
        }
        else if(mon && mon[`move${i}ChangeId`] > -1) {
            moveId = mon[`move${i}ChangeId`];
        }
        else {
            moveId = tr[`move${i}Id`];
        }

        if(moveId > -1) {
            table.appendChild(getMoveRow(moveId));
        }
    }

    contentDiv.appendChild(table);

    // Capacités Duo Dynamax

    let gmaxVar = monsterVariation.find(mv => mv.monsterId === monsterId && mv.form === 4);

    if(gmaxVar) {
        contentDiv.appendChild(document.createElement("br"));

        let table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        let titleRow = document.createElement("tr");

        let titleDynamax = document.createElement("th");
        titleDynamax.innerText = "Capacités Duo Dynamax";
        titleDynamax.colSpan = 6;
        titleRow.appendChild(titleDynamax);
        table.appendChild(titleRow);

        let headRow = document.createElement("tr");

        let headName = document.createElement("th");
        headName.innerText = "Nom";
        headRow.appendChild(headName);

        let headType = document.createElement("th");
        headType.innerText = "Type";
        headRow.appendChild(headType);

        let headCategory = document.createElement("th");
        headCategory.innerText = "Catégorie";
        headRow.appendChild(headCategory);

        let headPower = document.createElement("th");
        headPower.innerText = "Puissance";
        headRow.appendChild(headPower);

        let headTarget = document.createElement("th");
        headTarget.innerText = "Cible";
        headRow.appendChild(headTarget);

        let headEffect = document.createElement("th");
        headEffect.innerText = "Effet";
        headRow.appendChild(headEffect);

        table.appendChild(headRow);

        for(let i = 1; i < 5; i++) {
            let moveId = gmaxVar[`moveDynamax${i}Id`];

            if(moveId > -1) {
                table.appendChild(getGMaxMoveRow(moveId));
            }
        }

        contentDiv.appendChild(table);
    }

    contentDiv.appendChild(document.createElement("br"));

    table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    titleRow = document.createElement("tr");

    let titleSync = document.createElement("th");
    titleSync.innerText = "Capacité Duo";
    titleSync.colSpan = 5 + hasExUnlocked(syncPairSelect.value) + hasExRoleUnlocked(syncPairSelect.value);
    titleRow.appendChild(titleSync);
    table.appendChild(titleRow);

    headRow = document.createElement("tr");

    let syncHeadName = document.createElement("th");
    syncHeadName.innerText = "Nom";
    headRow.appendChild(syncHeadName);

    let syncHeadType = document.createElement("th");
    syncHeadType.innerText = "Type";
    headRow.appendChild(syncHeadType);

    let syncHeadCategory = document.createElement("th");
    syncHeadCategory.innerText = "Catégorie";
    headRow.appendChild(syncHeadCategory);

    let syncHeadPower = document.createElement("th");
    syncHeadPower.innerText = "Puissance";
    headRow.appendChild(syncHeadPower);

    let syncHeadEffect = document.createElement("th");
    syncHeadEffect.innerText = "Effet";
    headRow.appendChild(syncHeadEffect);

    if(hasExUnlocked(syncPairSelect.value)) {
        let syncHeadExEffect = document.createElement("th");
        syncHeadExEffect.innerText = "Effet (EX)";
        headRow.appendChild(syncHeadExEffect);
    }

    if(hasExRoleUnlocked(syncPairSelect.value)) {
        let syncHeadExRoleEffect = document.createElement("th");
        syncHeadExRoleEffect.innerText = "Role EX";
        headRow.appendChild(syncHeadExRoleEffect);
    }

    table.appendChild(headRow);
    table.appendChild(getSyncMoveRow(mon.syncMoveId, tr));

    contentDiv.appendChild(table);
}

function appendGridCategory(table, panels, category) {
    panels = panels.filter(p => p.type === category)
        .reduce((acc, curr) => {
            let cell = acc.find(a => a.cellId === curr.cellId);

            if(cell) {
                if(cell.version < curr.version) {
                    acc = acc.filter(a => a.cellId !== curr.cellId);
                    acc.push(curr);
                }

                return acc;
            }

            acc = acc.concat(curr);
            return acc;
        },[])
        .sort((a, b) => a.level - b.level || a.cellId - b.cellId);

    let headRow = document.createElement("tr");

    let categoryName = document.createElement("th");
    categoryName.style.backgroundColor = abilityTypeBGColor[category];
    categoryName.colSpan = 5;
    categoryName.innerText = abilityTypeTitle[category];
    headRow.appendChild(categoryName);
    table.appendChild(headRow);

    panels.forEach(p => {
        let tr = document.createElement("tr");

        if(p.isNew) {
            tr.style.backgroundColor = "#7afa96";
        }

        let amelioration = abilityName[p.ability.type];
        amelioration = amelioration.replace("{val}", p.ability.value);

        if(p.ability.passiveId) {
            amelioration = amelioration.replace("{passive}", getPassiveSkillName(p.ability.passiveId));
        }
        if(p.ability.moveId) {
            amelioration = amelioration.replace("{move}", moveNames[p.ability.moveId].replace("\n", " "));
        }

        let ameliorationCell = document.createElement("td");
        ameliorationCell.innerText = amelioration;
        tr.appendChild(ameliorationCell);

        let effectCell = document.createElement("td");
        effectCell.innerText = p.ability.passiveId ? getPassiveSkillDescr(p.ability.passiveId) : "–";
        tr.appendChild(effectCell);

        let energyCell = document.createElement("td");
        energyCell.innerText = p.energyCost || "–";
        tr.appendChild(energyCell);

        let orbCostCell = document.createElement("td");
        orbCostCell.innerText = p.orbCost;
        tr.appendChild(orbCostCell);

        let levelCell = document.createElement("td");
        levelCell.innerText = `${p.level}/5`;
        tr.appendChild(levelCell);

        table.appendChild(tr);
    });
}

function setSyncGrid() {
    let syncPairDiv = document.getElementById("syncPairDiv");
    let syncGridDiv = document.createElement("div");
    syncGridDiv.innerHTML = "<br /><h2>Plateau Duo-Gemme</h2>";

    syncPairDiv.appendChild(syncGridDiv);

    let charaScheduleId = schedule.map(s => s.scheduleId);
    let ap = abilityPanel.filter(ap => ap.trainerId === syncPairSelect.value)
        .map(ap => {
            ap.ability = ability.find(a => a.abilityId === ap.abilityId);
            ap.level = 1;
            ap.conditionIds.forEach(cid => (cid >= 12 && cid <= 15) ? ap.level = cid-10 : "");
            ap.type = getAbilityType(ap.ability);
            ap.isNew = charaScheduleId.includes(ap.scheduleId);
            return ap;
        });

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");

    let upgradeTitle = document.createElement("th");
    upgradeTitle.innerText = "Amélioration";
    headRow.appendChild(upgradeTitle);

    let effectTitle = document.createElement("th");
    effectTitle.innerText = "Effet";
    headRow.appendChild(effectTitle);

    let energyTitle = document.createElement("th");
    energyTitle.innerText = "Énergie requise";
    headRow.appendChild(energyTitle);

    let spheresTitle = document.createElement("th");
    spheresTitle.innerText = "Duo-Sphères requises";
    headRow.appendChild(spheresTitle);

    let trainerLevelTitle = document.createElement("th");
    trainerLevelTitle.innerText = "Niveau des capacités requis";
    headRow.appendChild(trainerLevelTitle);

    table.appendChild(headRow);

    Object.keys(abilityType).forEach(key => appendGridCategory(table, ap, abilityType[key]));

    syncGridDiv.appendChild(table);
}

function setTabContent(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {
    setPairOverview(contentDiv, monsterName, monsterId, monsterBaseId, variation);
    setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation);
    setPairPassives(contentDiv, variation);
    setPairTeamSkills(contentDiv);
    setPairMoves(contentDiv, monsterId, variation);
}

function createTab(monsterId, monTabs, tabContentDiv, pushState = false, isDefault = false, variation = null) {
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
        switchTab(monsterId, monsterBaseId, formId, pushState);
    }
}

function setPairInfos(id, pushState = false) {
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
            createTab(monsterIds[i], monTabs, tabContentDiv, pushState, true);
        }
        else {
            createTab(monsterIds[i], monTabs, tabContentDiv, pushState);
        }

        let variations = monsterVariation.filter(mv => mv.monsterId === monsterIds[i]);
        if(variations.length > 0) {
            pairVariations[monsterIds[i]] = variations;

            variations.forEach(v => {
                if(v.form !== 4)    // Ne pas inclure les Gigamax
                    createTab(monsterIds[i], monTabs, tabContentDiv, pushState, false, v)
            });
        }
    }

    setSyncGrid();

    if(isAdminMode) {
        dataArea.value = getPairBipCode(syncPairSelect.value);
    }
}

function setUrlMonsterInfos(monsterId, baseId, formId, pushState) {

    const url = new URL(window.location);

    if(url.searchParams.get('pair') !== syncPairSelect.value) {
        url.searchParams.set('pair', syncPairSelect.value);
    }

    url.searchParams.set('monsterId', monsterId);
    url.searchParams.set('baseId', baseId);
    url.searchParams.set('formId', formId);

    if(pushState)
        window.history.pushState(null, '', url.toString());
}

function setLatestPairs() {
    lastReleasePairsDiv = document.getElementById('lastReleasedPairs');
    let newTrainers = trainer
        .filter(t => schedule.map(s => s.scheduleId).includes(t.scheduleId))
        .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));

    let h2 = document.createElement("h2");
    h2.innerText = "Dernière mise à jour";
    lastReleasePairsDiv.appendChild(h2);

    let addedH3 = document.createElement("h3");
    addedH3.innerText = "Duos ajoutés";
    lastReleasePairsDiv.appendChild(addedH3);

    let ul = document.createElement("ul");

    newTrainers.forEach(tr => {
        let li = document.createElement("li");
        let b = document.createElement("b");
        let anchor = document.createElement("a");
        anchor.href = '#';
        anchor.textContent = getPairName(tr.trainerId);
        anchor.addEventListener("click", () => {
            syncPairSelect.value = tr.trainerId;
            selectChange();
        });

        b.appendChild(anchor);
        li.appendChild(b);
        ul.appendChild(li);
    });

    lastReleasePairsDiv.appendChild(ul);

    let gridH3 = document.createElement("h3");
    gridH3.innerText = "Plateaux étendus";
    lastReleasePairsDiv.appendChild(gridH3);

    let updatedGridTrainer = [...new Set(abilityPanel.filter(ap => schedule.map(s => s.scheduleId).includes(ap.scheduleId)).map(ap => ap.trainerId))]

    updatedGridTrainer = updatedGridTrainer.map(tid => {
        let trainerPanels = abilityPanel.filter(ap => ap.trainerId === tid);
        return {"trainerId" : tid, "new" : trainerPanels.length, "old" : trainerPanels.filter(tp => !schedule.map(s => s.scheduleId).includes(tp.scheduleId)).length };
    });

    ul = document.createElement("ul");

    updatedGridTrainer.forEach(ugt => {
        let li = document.createElement("li");
        let b = document.createElement("b");
        let anchor = document.createElement("a");
        anchor.href = '#';
        anchor.innerText = `${getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})`;
        anchor.addEventListener("click", () => {
            syncPairSelect.value = ugt.trainerId;
            selectChange();
        });

        b.appendChild(anchor);
        li.appendChild(b);
        ul.appendChild(li);
    });

    lastReleasePairsDiv.appendChild(ul);
}

function selectChange() {
    const url = new URL(window.location);
    url.searchParams.delete('monsterId');
    url.searchParams.delete('baseId');
    url.searchParams.delete('formId');
    url.searchParams.set('pair', syncPairSelect.value);

    window.history.pushState(null, '', url.toString());

    setPairInfos(syncPairSelect.value, false);
}

function urlStateChange() {
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
        switchTab(monsterId, baseId, formId, false);
    }
}

async function init() {
    syncPairSelect = document.getElementById("syncPairSelect");
    syncPairDiv = document.getElementById("syncPairDiv");
    toolsDiv = document.getElementById('adminTools');

    await getData();
    await getCustomJSON();

    if(isAdminMode) {
        dataArea = document.getElementById("dataArea");

        toolsDiv.style.display = "table";

        let downloadAllBtn = document.getElementById("downloadAll");
        downloadAllBtn.onclick = downloadAll;

        let downloadOneBtn = document.getElementById("downloadOne");
        downloadOneBtn.onclick = downloadData;

        let copyBtn = document.getElementById("copyBtn");
        copyBtn.addEventListener('click', () => navigator.clipboard.writeText(dataArea.value));
    }

    populateSelect();
    setLatestPairs();

    syncPairSelect.addEventListener('change', selectChange);

    urlStateChange();
    window.addEventListener('popstate', urlStateChange);
}
function getPairStatsRowBipCode(name, statValues, rarity, scale = 1) {
    const breakPointLevels = [1, 30, 45, 100, 120, 140, 200];

    let string = `\t\t[tr][th]${name}[/th]`;

    let level = 150;
    let pointBIdx = breakPointLevels.findIndex((a) => a > level);
    let pointAIdx = pointBIdx - 1;

    for(let i = rarity; i <= 6; i++) {
        let statValue = statValues[pointAIdx] + (level - breakPointLevels[pointAIdx])*(statValues[pointBIdx] - statValues[pointAIdx])/(breakPointLevels[pointBIdx] - breakPointLevels[pointAIdx]);

        if(i < 6)
            statValue += 20*(i-rarity)*(name === "PV" ? 2 : 1);
        else
            statValue += 20*(i-rarity)*(name === "PV" ? 5 : 2);

        statValue = Math.trunc(statValue*scale);

        string += `[td]`;

        if(scale > 1) {
            string += `[b][color=green]${statValue}[/color][/b]`;
        }
        else if(scale < 1) {
            string += `[b][color=red]${statValue}[/color][/b]`;
        }
        else {
            string += statValue;
        }

        string += `[/td]`;
    }

    string += `[/tr]\n`;
    return string;
}

function getMonsterStatsBipCode(m, rarity, v = null) {
    let string = `\t[item|nostyle][table]\n`
        + `\t\t[tr][th|colspan=${rarity+1}]${(v ? v.monsterName : getMonsterNameByMonsterId(m.monsterId))}[/th][/tr]\n`
        + `\t\t[tr][th]Stats max[/th]`;

    for(let i = rarity; i <= 6; i++) {
        string += `[th|width=50px]${i === 6 ? "5+" : i}★[/th]`;
    }

    string += `[/tr]\n`;
    string += getPairStatsRowBipCode("PV", m.hpValues, rarity);
    string += getPairStatsRowBipCode("Attaque", m.atkValues, rarity, (v ? v.atkScale/100 : 1));
    string += getPairStatsRowBipCode("Défense", m.defValues, rarity, (v ? v.defScale/100 : 1));
    string += getPairStatsRowBipCode("Atq. Spé.", m.spaValues, rarity, (v ? v.spaScale/100 : 1));
    string += getPairStatsRowBipCode("Déf. Spé.", m.spdValues, rarity, (v ? v.spdScale/100 : 1));
    string += getPairStatsRowBipCode("Vitesse", m.speValues, rarity, (v ? v.speScale/100 : 1));

    string += `\t[/table][/item]\n`;

    return string;
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

function getMoveBipCode(t, m, v = null) {
    let string = `[center][table]\n`
        + `\t[tr][th|colspan=9]Capacités[/th][/tr]\n`
        + `\t[tr][th|width=100px]Nom[/th][th|width=80px]Type[/th][th|width=80px]Catég.[/th][th|width=50px]Puis.[/th][th]Précis.[/th][th]Jauge[/th][th|width=80px]Cible[/th]\n`
        + `\t[th|width=350]Effet[/th][th|width=80px]Limite[/th][/tr]\n`;

    for(let i = 1; i < 5; i++) {
        let moveId;

        if(v && v[`move${i}Id`] > -1) {
            moveId = v[`move${i}Id`]
        }
        else if(m && m[`move${i}ChangeId`] > -1) {
            moveId = m[`move${i}ChangeId`];
        }
        else {
            moveId = t[`move${i}Id`];
        }

        if(moveId > -1) {
            let mov = move.find(m => m.moveId == moveId);
            string += `\t[tr]\n`
                + `\t\t[td]${moveNames[moveId].replace("\n", " ")}[/td]\n`
                + `\t\t[td]${mov.type ? `[type=${removeAccents(motifTypeName[mov.type].toLowerCase())}|MX]` : "–"}[/td]\n`
                + `\t\t[td][type=${removeAccents(categoryToFR[mov.category].toLowerCase())}|MX][/td]\n`
                + `\t\t[td]${mov.power ? `${mov.power}-${Math.trunc(mov.power*1.2)}` : "–"}[/td]\n`
                + `\t\t[td]${mov.accuracy || "–"}[/td]\n`
                + `\t\t[td]${mov.gaugeDrain ? `[img]/pages/jeuxvideo/pokemon-masters/images/jauge-capa-${mov.gaugeDrain}.png[/img]` : "–"}[/td]\n`
                + `\t\t[td]${moveTargetType[targetToId[mov.target]] || "–"}[/td]\n`
                + `\t\t[td]${getMoveDescr(moveId)}[/td]\n`
                + `\t\t[td]${mov.uses ? `${mov.uses} fois par combat` : "–"}[/td]\n`
                + `\t[/tr]\n`
        }
    }

    string += `[/table][/center]\n`;
    return string;
}

function appendGridCategoryBipCode(panels, category) {
    panels = panels.filter(p => p.type === category)
        .reduce((acc, curr) => {
            let cell = acc.find(a => a.cellId === curr.cellId);

            if(cell) {
                if(cell.version < curr.version) {
                    acc = acc.filter(a => a.cellId !== curr.cellId);
                    acc.push(curr);
                }

                return acc;
            }

            acc = acc.concat(curr);
            return acc;
        },[])
        .sort((a, b) => a.level - b.level || a.cellId - b.cellId);

    let string = `\t[tr][th|bgcolor=${abilityTypeBGColor[category]}|colspan=5]${abilityTypeTitle[category]}[/th][/tr]\n`;

    panels.forEach(p => {
        let amelioration = abilityName[p.ability.type];
        amelioration = amelioration.replace("{val}", p.ability.value);

        if(p.ability.passiveId) {
            amelioration = amelioration.replace("{passive}", getPassiveSkillName(p.ability.passiveId));
        }
        if(p.ability.moveId) {
            amelioration = amelioration.replace("{move}", moveNames[p.ability.moveId].replace("\n", " "));
        }

        string += `\t[tr]\n`
            + `\t\t[td]${amelioration}[/td]\n`
            + `\t\t[td]${p.ability.passiveId ? getPassiveSkillDescr(p.ability.passiveId) : "–"}[/td]\n`
            + `\t\t[td]${p.energyCost || "–"}[/td]\n`
            + `\t\t[td]${p.orbCost} [img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/duo-sphere.png[/img][/td]\n`
            + `\t\t[td][img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/niveau-capacites-${p.level}.png[/img][/td]\n`
            + `\t[/tr]\n`;
    });

    return string;
}

function getPairBipCode(trainerId) {
    let string = `[title]Pokémon Masters EX > ${getPairName(trainerId)}[/title]\n`
        + `[nav]jeuxvideo/pokemon-masters/navigation[/nav]\n`
        + `[h1]Pokémon Masters EX\nDuos Dex\n${getPairName(trainerId)}[/h1]\n`
        + `[include=jeuxvideo/pokemon-masters/duos/0-menu-deroulant]\n`
        + `[include=jeuxvideo/pokemon-masters/duos/menus-deroulants/A_MODIFIER]\n\n`
        + `[include=jeuxvideo/pokemon-masters/duos/0-sommaire-duo]\n\n`;

    let t = trainer.find(t => t.trainerId === trainerId);
    let pairEvolutions = monsterEvolution.filter(me => me.trainerId === trainerId);
    let monsterIds = [];
    let monsters = [];
    let pairVariations = {};
    monsterIds.push(t.monsterId);
    pairEvolutions.forEach(pe => monsterIds.push(pe.monsterIdNext));

    for(let i = 0; i < monsterIds.length; i++) {
        pairVariations[monsterIds[i]] = null;
        let variations = monsterVariation.filter(mv => mv.monsterId === monsterIds[i] && mv.form !== 4);
        if(variations.length > 0) {
            pairVariations[monsterIds[i]] = variations.map(v => {
                v.monsterBaseId = getMonsterBaseIdFromActorId(v.actorId);
                v.monsterName = getNameByMonsterBaseId(v.monsterBaseId, v.formId);
                return v;
            });
        }

        monsters.push(monster.find(m => m.monsterId === monsterIds[i]));
    }

    string += `[center][table]\n`
        + `\t[tr][th|width=430px|colspan=4]${getTrainerName(trainerId).replace("\n", "")}[/th][th|colspan=2|width=230px]`;

    for(let i = 0; i < monsters.length; i++) {
        if(i > 0)
            string += ", ";

        string += getMonsterNameByMonsterId(monsters[i].monsterId);

        if(pairVariations[monsterIds[i]])
            pairVariations[monsterIds[i]].forEach(v => {
                string += `, ${v.monsterName}`
            });
    }

    string += "[/th][/tr]\n"
        + "\t[tr]\n";

    string += `\t[td${hasExUnlocked(trainerId) ? "|rowspan=3" : ""}|colspan=4][img]/pages/jeuxvideo/pokemon-masters/images/personnages/A_MODIFIER.png[/img][/td]\n`
        + `\t[td|colspan=2]`;

    for(let i = 0; i < monsters.length; i++) {
        string += `[pokeimg=${getPokemonNumberFromMonsterBaseId(monsters[i].monsterBaseId)}|MX]`;

        if(pairVariations[monsterIds[i]])
            pairVariations[monsterIds[i]].forEach(v => {
                string += `[pokeimg=${getPokemonNumberFromMonsterBaseId(monsters[i].monsterBaseId)}A_MODIFIER|MX]`;
            });
    }

    string += `[/td]\n\t[/tr]\n`;

    if(hasExUnlocked(trainerId)) {
        string += `\t[tr][th|colspan=2]Tenue 6★ EX[/th][/tr]\n`
            + `\t[tr][td|colspan=2][img|w=230]/pages/jeuxvideo/pokemon-masters/images/personnages/A_MODIFIER-ex.png[/img][/td][/tr]\n`;
    }

    string += `\t[tr][th]Rôle[/th][th]Potentiel (Base)[/th][th]Type[/th][th]Faiblesse[/th][th]Origine[/th][th]Tenue[/th][/tr]\n`
        + `\t[tr]\n`
        + `\t[td|width=100px][img]/pages/jeuxvideo/pokemon-masters/images/roles/${getRoleUrlByTrainerId(trainerId)}.png[/img][br]${getRoleByTrainerId(trainerId)}[/td]\n`
        + `\t[td|width=100px]${"★".repeat(getTrainerRarity(trainerId))}[/td]\n`
        + `\t[td|width=100px][type=${removeAccents(motifTypeName[t.type].toLowerCase())}|MX][/td]\n`
        + `\t[td|width=100px][type=${removeAccents(motifTypeName[t.weakness].toLowerCase())}|MX][/td]\n`
        + `\t[td|width=200px]Pokémon A_MODIFIER[/td]\n`
        + `\t[td|width=200px]Pokémon A_MODIFIER[/td]\n`
        + `\t[/tr]\n`
        + `\t[tr][th|colspan=6]Descriptions[/th][/tr]\n`;

    if(trainerDescriptions[trainerId])
        string += `\t[tr][td|colspan=6]${trainerDescriptions[trainerId].replaceAll("\n", " ") }[/td][/tr]\n`;

    monsters.map(m => m.monsterBaseId).forEach(mbId => {
            if (monsterDescriptions[mbId])
                string += `\t[tr][td|colspan=6]${monsterDescriptions[mbId].replaceAll("\n", " ")}[/td][/tr]\n`;
        }
    );

    string += "[/table][/center]\n\n";

    string += `[ancre=analyse][h2]Analyse du Duo[/h2]\n`
        + `[i]Aucune pour le moment ![/i]\n\n`;

    string += `[ancre=stats][h2]Statistiques[/h2]\n`
        + `[listh]\n`;

    monsters.forEach(m => {
        string += getMonsterStatsBipCode(m, t.rarity);

        if(pairVariations[m.monsterId])
            pairVariations[m.monsterId].forEach(v => string += getMonsterStatsBipCode(m, t.rarity, v));
    });

    if(hasExRoleUnlocked(trainerId)) {
        string += `\t[include=jeuxvideo/pokemon-masters/duos/include/role-ex-${getRoleUrlByTrainerId(trainerId)}]\n`;
    }

    string += `[/listh]\n\n`;

    string += `[ancre=talents][h2]Talents[/h2]\n`;

    string += `[h3]${getMonsterNameByMonsterId(monsterIds[monsterIds.length - 1])}[/h3]\n`;
    string += getPassiveSkillBipCode(t);

    monsterIds.forEach(mId => {
        if(pairVariations[mId]) {
            pairVariations[mId].forEach(v => {
                string += `[h3]${v.monsterName}[/h3]\n`;
                string += getPassiveSkillBipCode(t, v);
            });
        }
    });

    string += `[center][table]\n`
        + `\t[tr][th|colspan=2]Talents d'équipe (Niv. 1 à 4)[/th][/tr]\n`
        + `\t[tr][td|colspan=2]Créez une équipe avec au moins deux Duos qui partagent un même mot-clé pour activer son effet.[/td][/tr]\n`
        + `\t[tr][th|width=200px]Nom[/th][th|width=400px]Effet (${getRoleByTrainerId(trainerId, true)})[/th][/tr]\n`;

    for(let i = 1; i <= 5; i++) {
        let ts = teamSkill.find(tsk => tsk.teamSkillId == t[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 1);
        let descr = []
        descr.push(teamSkill.find(tsk => tsk.teamSkillId == t[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 3));
        descr.push(teamSkill.find(tsk => tsk.teamSkillId == t[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 4));

        if(!ts)
            continue;

        string += `\t[tr][td]${teamSkillTag[ts.teamSkillPropValue]}[/td][td]`;

        let include= `[include=/jeuxvideo/pokemon-masters/duos/talents/mots-cles-${getRoleUrlByTrainerId(trainerId, false)}]`;
        if(i === 1) {
            include = `[include=/jeuxvideo/pokemon-masters/duos/talents/type-${getRoleUrlByTrainerId(trainerId, false)}]`;
        }

        const digitBlock = "[Digit:3digits ]";

        for(let i = 0; i < descr.length; i++) {
            if(descr[i]) {
                let d = teamSkillEffect[descr[i].teamSkillPropValue].replace("\n", " ");
                let index = d.indexOf(digitBlock);
                d = d.replace(digitBlock, "X");

                if(i > 0)
                    string += " ";

                string += `[tooltip=${d.substring(0, index + 1)}]${include}[/tooltip]${d.substring(index + 1)}`;
            }

        }

        string += "[/td][/tr]\n";
    }

    string += `[/table][/center]\n\n`;

    string += `[ancre=capacites][h2]Capacités[/h2]\n`

    string += `[h3]${getMonsterNameByMonsterId(monsterIds[monsterIds.length - 1])}[/h3]\n`;
    string += getMoveBipCode(t, monsters[monsters.length - 1]);

    monsters.forEach(m => {
        if(pairVariations[m.monsterId]) {
            pairVariations[m.monsterId].forEach(v => {
                string += `\n[h3]${v.monsterName}[/h3]\n`;
                string += getMoveBipCode(t, m, v);
            });
        }
    });

    let gmaxVar = monsterVariation.find(mv => mv.monsterId === monsterIds[monsterIds.length - 1] && mv.form === 4);

    if(gmaxVar) {

        string += `\n[center][table]\n`
            + `\t[tr][th|colspan=6|width=1000px][img|w=32]/pages/jeuxvideo/pokemon-masters/images/icones-combat/capacite-duo-dynamax.png[/img] Capacités Duo Dynamax[/th][/tr]\n`
            + `\t[tr][th|width=100px]Nom[/th][th|width=80px]Type[/th][th|width=80px]Catég.[/th][th|width=50px]Puis.[/th][th|width=80px]Cible[/th][th]Effet[/th][/tr]\n`;

        for(let i = 1; i < 5; i++) {
            let moveId = gmaxVar[`moveDynamax${i}Id`];

            if(moveId > -1) {
                let mov = move.find(m => m.moveId == moveId);
                string += `\t[tr]\n`
                    + `\t\t[td]${moveNames[moveId].replace("\n", " ")}[/td]\n`
                    + `\t\t[td]${mov.type ? `[type=${removeAccents(motifTypeName[mov.type].toLowerCase())}|MX]` : "–"}[/td]\n`
                    + `\t\t[td][type=${removeAccents(categoryToFR[mov.category].toLowerCase())}|MX][/td]\n`
                    + `\t\t[td]${mov.power ? `${mov.power}-${Math.trunc(mov.power*1.2)}` : "–"}[/td]\n`
                    + `\t\t[td]${moveTargetType[targetToId[mov.target]] || "–"}[/td]\n`
                    + `\t\t[td]${getMoveDescr(moveId)}[/td]\n`
                    + `\t[/tr]\n`
            }
        }

        string += `[/table][/center]\n`;
    }

    let syncMove = move.find(mov => mov.moveId === monsters[monsters.length - 1].syncMoveId);

    string += "\n[center][table]\n"
        + `\t[tr][th|colspan=${6+hasExUnlocked(trainerId)+hasExRoleUnlocked(trainerId)}|width=1000px][img|w=32]/pages/jeuxvideo/pokemon-masters/images/icones-combat/capacite-duo.png[/img] Capacité Duo[/th][/tr]\n`
        + `\t[tr][th|width=100px]Nom[/th][th|width=80px]Type[/th][th|width=80px]Catég.[/th][th|width=50px]Puis.[/th][th|width=200px]Effet[/th]`;

    if(hasExUnlocked(trainerId)) {
        string += `[th|width=150px]Effet (EX)[/th]`;
    }
    if(hasExRoleUnlocked(trainerId)) {
        string += `[th|width=150px]Rôle EX[/th]`;
    }

    string += `[/tr]\n`
        + `\t[tr]\n`
        + `\t\t[td]${moveNames[syncMove.moveId]}[/td]\n`
        + `\t\t[td]${syncMove.type ? `[type=${removeAccents(motifTypeName[syncMove.type].toLowerCase())}|MX]` : "–"}[/td]\n`
        + `\t\t[td][type=${removeAccents(categoryToFR[syncMove.category].toLowerCase())}|MX][/td]\n`
        + `\t\t[td]${syncMove.power ? `${syncMove.power}-${Math.trunc(syncMove.power*1.2)}` : "–"}[/td]\n`
        + `\t\t[td]${getMoveDescr(syncMove.moveId)}[/td]\n`;

    if(hasExUnlocked(trainerId)) {
        string += `\t\t[td]${exSyncEffect[t.role]}[/td]\n`;
    }
    if(hasExRoleUnlocked(trainerId)) {
        string += `\t\t[td]${exSyncEffect[getExRoleId(trainerId)]}[/td]\n`;
    }

    string += `\t[/tr]\n`
        + `[/table][/center]\n\n`;

    string += `[ancre=plateau][h2]Plateau Duo-Gemme[/h2]\n`
        + `[center][table]\n`
        + `\t[tr][th|width=250px]Amélioration[/th][th|width=300px]Effet[/th][th|width=100px]Énergie requise[/th][th|width=100px]Duo-Sphères requises[/th][th|width=100px]Niveau des Capacités requis[/th][/tr]\n`;

    let ap = abilityPanel.filter(ap => ap.trainerId === trainerId)
        .map(ap => {
            ap.ability = ability.find(a => a.abilityId === ap.abilityId);
            ap.level = 1;
            ap.conditionIds.forEach(cid => (cid >= 12 && cid <= 15) ? ap.level = cid-10 : "");
            ap.type = getAbilityType(ap.ability);
            return ap;
        });

    Object.keys(abilityType).forEach(key => string += appendGridCategoryBipCode(ap, abilityType[key]));

    string += `[/table][/center]\n\n`;

    string += `[hr][center][b][url=/page/jeuxvideo/pokemon-masters/duos/accueil][fa=list] Retour à l'accueil du Duos Dex[/url]\n`
        + `[url=/page/jeuxvideo/pokemon-masters/accueil][fa-lg=home] Retour à l'accueil du dossier[/url][/b][/center]`;

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
            saveAs(content, "Duos.zip");
        });
}

init().then();
