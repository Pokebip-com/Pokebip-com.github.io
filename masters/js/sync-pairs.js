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
let versions;

let monsterDescriptions;
let monsterForms;
let monsterNames;
let motifTypeName;
let teamSkillTag;
let trainerDescriptions;
let trainerNames;
let trainerVerboseNames;

let syncPairSelect;
let syncPairDiv;
let toolsDiv;

async function getData() {
    const [
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
        monsterDescriptionResponse,
        monsterFormResponse,
        monsterNameResponse,
        motifTypeNameResponse,
        teamSkillTagResponse,
        trainerDescriptionResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,
    ] = await Promise.all([
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
        fetch("./data/lsd/monster_description_fr.json"),
        fetch("./data/lsd/monster_form_fr.json"),
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/motif_type_name_fr.json"),
        fetch("./data/lsd/team_skill_tag_fr.json"),
        fetch("./data/lsd/trainer_description_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json"),
        fetch("./data/lsd/trainer_verbose_name_fr.json")
    ])
        .catch(error => console.log(error));

    abilityPanel = await abilityPanelResponse.json();
    abilityPanel = abilityPanel.entries;

    exRoleStatusUp = await exRoleStatusUpResponse.json();
    exRoleStatusUp = exRoleStatusUp.entries;

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

function switchTab(monsterId, monsterBaseId, formId) {
    setUrlMonsterInfos(monsterId, monsterBaseId, formId);

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
    console.log(mov);

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

function setTabContent(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {
    setPairOverview(contentDiv, monsterName, monsterId, monsterBaseId, variation);
    setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation);
    setPairPassives(contentDiv, variation);
    setPairTeamSkills(contentDiv);
    setPairMoves(contentDiv, monsterId, variation);
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
