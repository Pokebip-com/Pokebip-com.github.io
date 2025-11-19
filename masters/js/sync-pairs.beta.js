let abilityType = {
    "1": "StatsBoost",
    "2": "Passive",
    "3": "AdditionalMoveEffect",
    "4": "MovePowerAccuracyBoost",
    "5": "SyncMove",
    "6": "LearnMove"
};

let abilityTypeBGColor = {
    "StatsBoost": "#779EFF",
    "MovePowerAccuracyBoost": "#47D147",
    "AdditionalMoveEffect": "#FF0066",
    "Passive": "#FFC266",
    "SyncMove": "#BF80FF",
    "LearnMove": "#FF80BF"
};

const gymStartScheduleId = "7010_1W_Gym_start";

let dataArea;
let lastReleasePairsDiv;
let syncPairSelect;
let syncPairDiv;
let toolsDiv;

let landingPairId;

let syncLevel = 5;
let maxEnergy = 60;

const NOT_IMPLEMENTED = ["10101420000", "10286000001"];

class SyncGridShareManager {

    constructor() {
        this.paramName = 'build';
    }

    init(container) {
        this.container = container ?? document;
        this.refresh();
        this.observer = new MutationObserver((list) => {
            for (const m of list) {
                if (m.type === "attributes" && m.attributeName === "selected") {
                    this.dirty = true
                    break;
                }
            }
        });
        this.observer.observe(this.container, {
            subtree: true,
            attributes: true,
            attributeFilter: ["selected"]
        });
    }

    refresh() {
        this.cells = Array.from(document.querySelectorAll("g[data-cell-id]"));
        this.sorted = [...this.cells].sort((a, b) => BigInt(this.getCellId(a)) < BigInt(this.getCellId(b)) ? -1 : 1);
        this.indexById = new Map(this.sorted.map((el, idx) => [this.getCellId(el), idx]));
        this.dirty = false;
    }

    b64urlEncode(bytes) {
        let bin = '';
        bytes.forEach(b => bin += String.fromCharCode(b));
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    b64urlDecode(b64u) {
        const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    encodeState() {
        const n = this.sorted.length;
        const bytes = new Uint8Array(Math.ceil(n / 8));
        for (const el of this.sorted) {
            const idx = this.indexById.get(this.getCellId(el));
            const selected = el.hasAttribute('selected');
            if (selected) bytes[idx >> 3] |= (1 << (idx & 7));
        }
        return this.b64urlEncode(bytes);
    }

    applyState(token) {
        const bytes = this.b64urlDecode(token);
        for (const el of this.sorted) {
            const idx = this.indexById.get(this.getCellId(el));
            const bit = (bytes[idx >> 3] >> (idx & 7)) & 1;
            if (bit) changeSelection(el);
        }
    }

    readTokenFromURL() {
        const url = new URL(location.href);
        return url.searchParams.get(this.paramName);
    }

    buildShareURL() {
        if (this.dirty)
            this.refresh();

        const url = new URL(location.href);
        let state = this.encodeState();
        if (state !== "") {
            url.searchParams.set(this.paramName, this.encodeState());
        }
        return url.toString();
    }

    getCellId = (el) => el.dataset.cellId ?? null;

    copyUrl = async () => {
        const text = this.buildShareURL();
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "absolute";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            const isDoneOk = document.execCommand && document.execCommand("copy");
            document.body.removeChild(ta);
            return !!isDoneOk;
        }
    }

    shareBuild = async () => {
        const url = this.buildShareURL();
        if (navigator.share) {
            try {
                await navigator.share({ title: document.title, url });
            } catch { }
        } else {
            await this.copyUrl();
        }
    }
}

const syncGridShareManager = new SyncGridShareManager();

async function getData() {

    // PROTO
    jsonCache.preloadProto("Ability");
    jsonCache.preloadProto("AbilityPanel");
    jsonCache.preloadProto("AbilityPanelReleaseItemSet");
    jsonCache.preloadProto("AbilityReleaseCondition");
    jsonCache.preloadProto("ExRoleStatusUp");
    jsonCache.preloadProto("Monster");
    jsonCache.preloadProto("MonsterEnhancement");
    jsonCache.preloadProto("MonsterEvolution");
    jsonCache.preloadProto("MonsterVariation");
    jsonCache.preloadProto("PotentialItem");
    jsonCache.preloadProto("PotentialLot");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("SpecialAwakingEffect");
    jsonCache.preloadProto("TeamSkill");
    jsonCache.preloadProto("Trainer");
    jsonCache.preloadProto("TrainerBuildupConfig");
    jsonCache.preloadProto("TrainerBuildupParameter");
    jsonCache.preloadProto("TrainerSpecialAwaking");

    // LSD
    jsonCache.preloadLsd("ability_name");
    jsonCache.preloadLsd("monster_description");
    jsonCache.preloadLsd("motif_type_name");
    jsonCache.preloadLsd("special_awaking_level_effect_description");
    jsonCache.preloadLsd("team_skill_tag");
    jsonCache.preloadLsd("team_skill_effect");
    jsonCache.preloadLsd("trainer_description");

    // Locale
    jsonCache.preloadLocale("sync-pairs");
    jsonCache.preloadLocale("lucky-skills");

    // Custom
    jsonCache.preloadCustom("version_release_dates");

    preloadUtils(true);
    preloadMovePassiveSkills();

    await jsonCache.runPreload()
    orderByVersion(jData.custom.versionReleaseDates);

    jData.proto.schedule = jData.proto.schedule
        .filter(s => s.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp && (s.scheduleId.startsWith("chara_") || s.scheduleId === gymStartScheduleId));
}

function populateSelect() {
    while (syncPairSelect.length > 0) {
        syncPairSelect.remove(0);
    }
    let optionData = jData.proto.trainer.filter(t => t.scheduleId !== "NEVER_CHECK_DICTIONARY" && t.scheduleId !== "NEVER" && t.scoutMethod !== 3)
        .map(t => {
            let data = {};
            data.value = t.trainerId;
            data.text = getPairName(t.trainerId);
            return data;
        }).sort((a, b) => a.text.localeCompare(b.text));

    for (const opt of optionData) {
        syncPairSelect.add(new Option(opt.text, opt.value));
    }
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
    let trainerActorDress = getActorDressFromTrainerId(syncPairSelect.value);
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

    if (hasExUnlocked(syncPairSelect.value) && trainerActorDress) {
        pokemonImageCell.rowSpan = 3;

        exTitleRow = document.createElement("tr");
        let exTitle = document.createElement("th");
        exTitle.innerText = jData.locale.syncPairs.ex_clothing;
        exTitle.colSpan = 5;
        exTitleRow.appendChild(exTitle);

        exImageRow = document.createElement("tr");
        let exImageCell = document.createElement("td");

        exImageCell.style.backgroundImage = `url("./data/actor/mindscape/Tx_${trainerActorId}_mindscape00.png")`;
        exImageCell.style.backgroundPosition = "center";
        exImageCell.style.backgroundSize = "cover";
        exImageCell.style.backgroundRepeat = "no-repeat";
        exImageCell.colSpan = 5;

        let exImg = document.createElement("img");

        exImg.src = `./data/actor/Trainer/${trainerActorDress.actorDress}_expose/${trainerActorDress.actorDress}_expose_1024.png`;
        exImg.style.maxWidth = "256px";

        exImageCell.appendChild(exImg);
        exImageRow.appendChild(exImageCell);

        table.appendChild(exTitleRow);
        table.appendChild(exImageRow);
    }

    let infosTitleRow = document.createElement("tr");
    let roleTitle = document.createElement("th");
    roleTitle.innerText = jData.locale.syncPairs.role;
    roleTitle.colSpan = 2;

    let exRoleTitle = document.createElement("th");
    exRoleTitle.innerText = jData.locale.syncPairs.ex_role;
    exRoleTitle.colSpan = 2;

    let potentielTitle = document.createElement("th");
    potentielTitle.innerText = jData.locale.syncPairs.potential_base;
    potentielTitle.colSpan = 2;

    let typeTitle = document.createElement("th");
    typeTitle.innerText = jData.locale.syncPairs.type;
    typeTitle.colSpan = 2;

    let weaknessTitle = document.createElement("th");
    weaknessTitle.innerText = jData.locale.syncPairs.weakness;
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
    typeCell.innerText = variation && variation.type > 0 ? jData.lsd.motifTypeName[variation.type] : getTrainerTypeName(syncPairSelect.value);
    typeCell.colSpan = 2;

    let weaknessCell = document.createElement("td");
    weaknessCell.innerText = variation && variation.weakness > 0 ? jData.lsd.motifTypeName[variation.weakness] : getTrainerWeaknessName(syncPairSelect.value);
    weaknessCell.colSpan = 2;

    infosRow.appendChild(roleCell);
    infosRow.appendChild(exRoleCell);
    infosRow.appendChild(potentielCell);
    infosRow.appendChild(typeCell);
    infosRow.appendChild(weaknessCell);
    table.appendChild(infosRow);

    let descrTitleRow = document.createElement("tr");
    let descrTitle = document.createElement("th");
    descrTitle.innerText = jData.locale.syncPairs.descriptions;
    descrTitle.colSpan = 10;
    descrTitleRow.appendChild(descrTitle);
    table.appendChild(descrTitleRow);

    let descrTrainerTxt = agenderDescription(jData.lsd.trainerDescription[syncPairSelect.value]);

    if (descrTrainerTxt) {
        let descrTrainerRow = document.createElement("tr");
        let descrTrainer = document.createElement("td");
        descrTrainer.innerText = descrTrainerTxt.replaceAll("\n", " ");
        descrTrainer.colSpan = 10;
        descrTrainerRow.appendChild(descrTrainer);
        table.appendChild(descrTrainerRow);
    }

    let descrMonsterTxt = jData.lsd.monsterDescription[monsterBaseId];

    if (descrMonsterTxt) {
        let descrMonsterRow = document.createElement("tr");
        let descrMonster = document.createElement("td");
        descrMonster.innerText = descrMonsterTxt.replaceAll("\n", " ");
        descrMonster.colSpan = 10;
        descrMonsterRow.appendChild(descrMonster);
        table.appendChild(descrMonsterRow);
    }

    let tableWrapperOverview = document.createElement("div");
    tableWrapperOverview.style.overflowX = "auto";
    tableWrapperOverview.appendChild(table);
    contentDiv.appendChild(tableWrapperOverview);
}

function getStatRow(name, statValues, rarity, level, exRoleBonus, scale = 1) {
    const breakPointLevels = [1, 30, 45, 100, 120, 140, 200];

    let tr = document.createElement("tr");
    let th = document.createElement("th");
    th.innerText = jData.locale.common[name];

    tr.appendChild(th);

    let pointBIdx = breakPointLevels.findIndex((a) => a >= level);
    let pointAIdx = pointBIdx - 1;

    let buildupParameter = jData.proto.trainerBuildupParameter.filter(tbp => tbp.trainerId === syncPairSelect.value);
    let buildupBonus = 0;

    let numCols = 6 - rarity + 1;

    for (let i = 0; i < numCols; i++) {
        let statValue = statValues[pointAIdx] + (level - breakPointLevels[pointAIdx]) * (statValues[pointBIdx] - statValues[pointAIdx]) / (breakPointLevels[pointBIdx] - breakPointLevels[pointAIdx]);

        if (i > 0) {
            let buildupPowerups = jData.proto.trainerBuildupConfig.find(tbc => tbc.trainerBuildupConfigId === buildupParameter[i - 1].trainerBuildupConfigId).nbPowerups || 0;
            buildupBonus += buildupPowerups * buildupParameter[i - 1][name];
            statValue += buildupBonus;
        }

        statValue = Math.trunc(statValue * scale);

        statValue += exRoleBonus;

        let td = document.createElement("td");

        if (scale > 1) {
            td.innerHTML = `<b style="color: green">${statValue}</b>`;
        }
        else if (scale < 1) {
            td.innerHTML = `<b style="color: darkred">${statValue}</b>`;
        }
        else {
            td.innerText = statValue;
        }

        tr.appendChild(td);
    }

    return tr;
}

function setStatsTable(input, statsDiv, monsterData, variation = null, hasExRole = false, exRoleCheckboxId = "") {
    if (input.value === "")
        return;

    statsDiv.innerHTML = "";

    let rarity = getTrainerRarity(syncPairSelect.value);
    let exRoleCheckbox = document.getElementById(exRoleCheckboxId);
    let exRoleStats = hasExRole && exRoleCheckbox && exRoleCheckbox.checked;

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");

    let statsMaxTh = document.createElement("th");
    statsMaxTh.innerText = jData.locale.syncPairs.max_stats;
    headRow.appendChild(statsMaxTh);

    for (let i = rarity; i <= 6; i++) {
        let th = document.createElement("th");
        th.innerText = (i === 6 ? "5+★" : `${i}★`);
        headRow.appendChild(th);
    }

    let exRoleBonus = { "hp": 0, "atk": 0, "spa": 0, "def": 0, "spd": 0, "spe": 0 };

    if (exRoleStats) {
        let exRoleId = getExRoleId(syncPairSelect.value);
        exRoleBonus = jData.proto.exRoleStatusUp.find(ersu => ersu.roleId === exRoleId);
    }

    table.appendChild(headRow);
    table.appendChild(getStatRow("hp", monsterData.hpValues, rarity, input.value, exRoleBonus.hp));
    table.appendChild(getStatRow("atk", monsterData.atkValues, rarity, input.value, exRoleBonus.atk, (variation ? variation.atkScale / 100 : 1)));
    table.appendChild(getStatRow("def", monsterData.defValues, rarity, input.value, exRoleBonus.def, (variation ? variation.defScale / 100 : 1)));
    table.appendChild(getStatRow("spa", monsterData.spaValues, rarity, input.value, exRoleBonus.spa, (variation ? variation.spaScale / 100 : 1)));
    table.appendChild(getStatRow("spd", monsterData.spdValues, rarity, input.value, exRoleBonus.spd, (variation ? variation.spdScale / 100 : 1)));
    table.appendChild(getStatRow("spe", monsterData.speValues, rarity, input.value, exRoleBonus.spe, (variation ? variation.speScale / 100 : 1)));
    statsDiv.appendChild(table);
}

function setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {

    let monsterData = getMonsterById(monsterId);

    let statsH2 = document.createElement("h2");
    statsH2.innerText = jData.locale.syncPairs.stats;
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
    toolFieldset.innerHTML = `<legend><b>${jData.locale.syncPairs.stats_settings}</b></legend>`;

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
    defaultLevels.appendChild(new Option("", "200"));
    toolFieldset.appendChild(defaultLevels);

    let lvlP = document.createElement("p");
    lvlP.style.display = "table-row";

    let lvlLabel = document.createElement("label");
    lvlLabel.setAttribute("for", "levelInput");
    lvlLabel.innerHTML = `<b>${jData.locale.syncPairs.level}: </b>`;
    lvlLabel.style.display = "table-cell";
    lvlLabel.style.textAlign = "right";
    lvlP.appendChild(lvlLabel);

    let lvlInput = document.createElement("input");
    lvlInput.type = "number";
    lvlInput.value = "200";
    lvlInput.min = "1";
    lvlInput.max = "200";
    lvlInput.id = "levelInput";
    lvlInput.style.display = "table-cell";
    lvlInput.style.marginLeft = "5px";
    lvlInput.setAttribute("list", "defaultLevels");
    lvlP.appendChild(lvlInput);
    toolFieldset.appendChild(lvlP);

    if (hasExRoleUnlocked(syncPairSelect.value)) {
        let exRoleP = document.createElement("p");
        exRoleP.style.display = "table-row";

        let exRoleLabel = document.createElement("label");
        exRoleLabel.setAttribute("for", "exRoleCheckbox");
        exRoleLabel.style.display = "table-cell";
        exRoleLabel.style.textAlign = "right";
        exRoleLabel.innerHTML = `<b>${jData.locale.syncPairs.ex_role_unlocked}: </b>`;
        exRoleP.appendChild(exRoleLabel)


        let exRoleCheckbox = document.createElement("input");
        exRoleCheckbox.type = "checkbox";
        exRoleCheckbox.id = `exRoleCheckbox-${monsterBaseId}-${formId}`;
        exRoleCheckbox.style.display = "table-cell";
        exRoleCheckbox.style.marginLeft = "5px";
        exRoleCheckbox.addEventListener("change", (_) => setStatsTable(lvlInput, statsDiv, monsterData, variation, hasExRoleUnlocked(syncPairSelect.value), `exRoleCheckbox-${monsterBaseId}-${formId}`));
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

    lvlInput.addEventListener("change", (e) => setStatsTable(e.currentTarget, statsDiv, monsterData, variation, hasExRoleUnlocked(syncPairSelect.value), `exRoleCheckbox-${monsterBaseId}-${formId}`));
    setStatsTable(lvlInput, statsDiv, monsterData, variation);
}

function setPairPassives(contentDiv, variation = null) {
    let tr = jData.proto.trainer.find(t => t.trainerId === syncPairSelect.value);

    let skillsH2 = document.createElement("h2");
    skillsH2.innerText = jData.locale.syncPairs.skills_title;
    contentDiv.appendChild(skillsH2);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");
    let headTitle = document.createElement("th");
    headTitle.colSpan = 2;
    headTitle.innerText = jData.locale.syncPairs.passive_skills;
    headRow.appendChild(headTitle);
    table.appendChild(headRow);

    let titleRow = document.createElement("tr");
    let nameTitle = document.createElement("th");
    nameTitle.innerText = jData.locale.syncPairs.passive_skill_name;
    titleRow.appendChild(nameTitle);

    let descrTitle = document.createElement("th");
    descrTitle.innerText = jData.locale.syncPairs.passive_skill_description;
    titleRow.appendChild(descrTitle);

    table.appendChild(titleRow);

    let specialAwaking = jData.proto.trainerSpecialAwaking.find(t => t.trainerId === syncPairSelect.value);

    if (specialAwaking) {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerHTML = `<img src="./data/sync-grids/icons/transcendance.png" style="width: 25px; vertical-align: top;" /> ${getDetailedPassiveSkillName(specialAwaking['passiveSkillId'])}`;
        row.appendChild(nameCell);

        let descrCell = document.createElement("td");
        descrCell.innerText = getPassiveSkillDescr(specialAwaking[`passiveSkillId`]);
        row.appendChild(descrCell);

        table.appendChild(row);
    }

    for (let i = 1; i <= 5; i++) {
        const passiveId = variation && variation[`passive${i}Id`] > 0 ? variation[`passive${i}Id`] : tr[`passive${i}Id`];

        if (passiveId === 0)
            continue;

        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerHTML = getDetailedPassiveSkillName(passiveId);
        row.appendChild(nameCell);

        let descrCell = document.createElement("td");
        descrCell.innerText = getPassiveSkillDescr(passiveId);
        row.appendChild(descrCell);

        table.appendChild(row);
    }

    let tableWrapper = document.createElement("div");
    tableWrapper.style.overflowX = "auto";
    tableWrapper.appendChild(table);
    contentDiv.appendChild(tableWrapper);
}

function setPairSuperAwakening(contentDiv) {
    let trsa = jData.proto.trainerSpecialAwaking.find(t => t.trainerId === syncPairSelect.value);
    const role = jData.proto.trainer.find(t => t.trainerId === syncPairSelect.value).role;

    if (!trsa || !role)
        return;

    const saEffect = Object.groupBy(jData.proto.specialAwakingEffect.filter(sae => sae.roleId === role)
        .sort((a, b) => a.specialAwakingLevel - b.specialAwakingLevel), ({ specialAwakingLevel }) => specialAwakingLevel);

    let specialAwakingH2 = document.createElement("h2");
    specialAwakingH2.innerText = jData.locale.syncPairs.superawakening;
    contentDiv.appendChild(specialAwakingH2);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");

    let headLevel = document.createElement("th");
    headLevel.innerText = jData.locale.syncPairs.superawakening_level;
    headRow.appendChild(headLevel);

    let headEffect = document.createElement("th");
    headEffect.innerText = jData.locale.syncPairs.superawakening_effect;
    headRow.appendChild(headEffect);

    table.appendChild(headRow);

    for (let i = 1; i <= Object.keys(saEffect).length; i++) {
        let row = document.createElement("tr");

        let levelCell = document.createElement("th");
        levelCell.innerText = i;
        row.appendChild(levelCell);

        let effectCell = document.createElement("td");
        let titleEffectShown = false;

        for (let j = 0; j < saEffect[i].length; j++) {
            switch (saEffect[i][j].specialAwakingLevelEffect) {
                case 1:
                    if (!titleEffectShown) {
                        titleEffectShown = true;
                        effectCell.innerText = jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}`]
                            .replaceAll("\n", " ");
                    }

                    effectCell.innerHTML += "<br>" + jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}_element_${saEffect[i][j].arg1}`]
                        .replace("[Digit:3digits ]", saEffect[i][j].arg2);
                    break;

                case 2:
                    effectCell.innerText = jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}`]
                        .replaceAll("\n", " ")
                        .replace("[Digit:3digits ]", saEffect[i][j].arg2 / 100)
                    break;

                case 3:
                    effectCell.innerText = jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}`]
                        .replaceAll("\n", " ") + ` (x${saEffect[i][j].arg1 / 100})`;
                    break;

                case 4:
                    effectCell.innerText = jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}`].replaceAll("\n", " ") + ` (x${saEffect[i][j].arg1 / 100})`;
                    effectCell.innerHTML += "<br>" + jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}_element`].replaceAll("\n", " ") + ` (x${saEffect[i][j].arg1 / 100})`;
                    break;

                case 5:
                    effectCell.innerText = jData.lsd.specialAwakingLevelEffectDescription[`${saEffect[i][j].specialAwakingLevelEffect}`]
                        .replaceAll("\n", " ");
                    break;
            }
        }

        switch (saEffect[i].specialAwakingLevelEffect) {
            case 1:
                headEffect.innerText = jData.locale.syncPairs.superawakening_effect;
                break;
            case 2:
                headEffect.innerText = jData.locale.syncPairs.superawakening_effect_2;
                break;
            case 3:
                headEffect.innerText = jData.locale.syncPairs.superawakening_effect_3;
                break;
        }

        row.appendChild(effectCell);
        table.appendChild(row);
    }

    contentDiv.appendChild(table);
}

function getCookieItemImage(cookie) {
    return getItemImage(cookie.imageId, cookie.rarity);
}

function getCookieName(cookie) {
    if (cookie.potentialItemName === "")
        return jData.lsd.potentialItemName[cookie.itemId];

    return jData.lsd.potentialItemName[cookie.potentialItemName].replace("[Name:TrainerNameAndType ]", getTrainerName(cookie.trainerId));
}

function setPairLuckySkills(contentDiv) {
    let luckySkills = jData.proto.potentialItem.filter(pi => pi.trainerId === syncPairSelect.value);

    if (luckySkills.length === 0)
        return;

    contentDiv.appendChild(document.createElement("br"));

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let lsTitleRow = document.createElement("tr");
    let lsTitleCell = document.createElement("th");
    lsTitleCell.innerText = jData.locale.common.submenu_lucky_skills;
    lsTitleCell.colSpan = 4;
    lsTitleRow.appendChild(lsTitleCell);
    table.appendChild(lsTitleRow);

    let titleRow = document.createElement("tr");
    let imageTitleCell = document.createElement("th");
    imageTitleCell.innerText = jData.locale.luckySkills.trainer_cookies;
    let nameTitleCell = document.createElement("th");
    nameTitleCell.innerText = jData.locale.luckySkills.passive_name_title;
    let descriptionTitleCell = document.createElement("th");
    descriptionTitleCell.innerText = jData.locale.luckySkills.passive_descr_title;
    let dropRateTitleCell = document.createElement("th");
    dropRateTitleCell.innerText = jData.locale.luckySkills.passive_drop_rate_title;

    titleRow.appendChild(imageTitleCell);
    titleRow.appendChild(nameTitleCell);
    titleRow.appendChild(descriptionTitleCell);
    titleRow.appendChild(dropRateTitleCell);
    table.appendChild(titleRow);

    luckySkills.forEach(ls => {
        let lot = jData.proto.potentialLot.filter(pl => parseInt(pl.potentialLotId) === ls.potentialLotId);
        let lotFullRate = lot.reduce((acc, val) => acc + val.rate, 0);

        let cookieTD = document.createElement("td");
        cookieTD.appendChild(getCookieItemImage(ls));
        cookieTD.appendChild(document.createElement("br"));
        let bTag = document.createElement("b");
        bTag.innerText = getCookieName(ls);
        cookieTD.appendChild(bTag);

        cookieTD.rowSpan = lot.length;

        for (let i = 0; i < lot.length; i++) {
            let row = document.createElement("tr");

            if (i === 0)
                row.appendChild(cookieTD);

            let nameTD = document.createElement("td");
            nameTD.innerHTML = getDetailedPassiveSkillName(lot[i].potentialId);

            let descriptionTD = document.createElement("td");
            descriptionTD.innerHTML = getPassiveSkillDescr(lot[i].potentialId);

            let dropRateTD = document.createElement("td");
            dropRateTD.innerText = `${Math.round(lot[i].rate / lotFullRate * 100)}%`;

            row.appendChild(nameTD);
            row.appendChild(descriptionTD);
            row.appendChild(dropRateTD);

            table.appendChild(row);
        }
    });

    let tableWrapper = document.createElement("div");
    tableWrapper.style.overflowX = "auto";
    tableWrapper.appendChild(table);
    contentDiv.appendChild(tableWrapper);
}

function setPairTeamSkills(contentDiv) {
    let tr = jData.proto.trainer.find(t => t.trainerId === syncPairSelect.value);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let titleRow = document.createElement("tr");
    let titleCell = document.createElement("th");
    titleCell.innerText = jData.locale.syncPairs.team_skills;

    let row = document.createElement("tr");

    for (let i = 1; i <= 5; i++) {
        let ts = jData.proto.teamSkill.find(tsk => tsk.teamSkillId == tr[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 1);

        if (!ts)
            continue;

        let td = document.createElement("td");
        td.innerText = jData.lsd.teamSkillTag[ts.teamSkillPropValue];
        row.appendChild(td);

        titleCell.colSpan++;
    }

    titleRow.appendChild(titleCell);
    table.appendChild(titleRow);
    table.appendChild(row);

    contentDiv.appendChild(document.createElement("br"));
    let tableWrapper = document.createElement("div");
    tableWrapper.style.overflowX = "auto";
    tableWrapper.appendChild(table);
    contentDiv.appendChild(tableWrapper);
}

function getTooltipMoveData(moveId) {
    let mov = jData.proto.move.find(m => m.moveId == moveId);
    let p = document.createElement("p");

    p.innerHTML += `<b>${jData.locale.syncPairs.move_description}:</b> ${getMoveDescr(moveId)}<br />`;

    if (mov.type > 0) {
        p.innerHTML += `<b>${jData.locale.syncPairs.move_type}:</b> ${jData.lsd.motifTypeName[mov.type]}<br />`;
    }
    p.innerHTML += `<b>${jData.locale.syncPairs.move_category}:</b> ${jData.locale.common.category_names[mov.category]}<br />`;
    if (mov.gaugeDrain) {
        p.innerHTML += `<b>${jData.locale.syncPairs.move_gauge}:</b> ${mov.gaugeDrain}<br />`;
    }
    if (mov.power > 0) {
        p.innerHTML += `<b>${jData.locale.syncPairs.move_power}:</b> ${mov.power + " - " + Math.floor(mov.power * 1.2)}<br />`;
    }
    if (mov.accuracy) {
        p.innerHTML += `<b>${jData.locale.syncPairs.move_accuracy}:</b> ${mov.accuracy}<br />`;
    }
    if (jData.lsd.moveTargetType[targetToId[mov.target]]) {
        p.innerHTML += `<b>${jData.locale.syncPairs.move_target}:</b> ${jData.lsd.moveTargetType[targetToId[mov.target]]}<br />`;
    }
    if (mov.uses) {
        p.innerHTML += `<b>${jData.locale.syncPairs.move_uses}:</b> ${mov.uses}<br />`;
    }

    return p;
}

function getMoveRow(moveId) {
    let mov = jData.proto.move.find(m => m.moveId == moveId);

    let tr = document.createElement("tr");

    let nameCell = document.createElement("td");
    nameCell.innerText = jData.lsd.moveName[moveId];
    tr.appendChild(nameCell);

    let typeCell = document.createElement("td");
    typeCell.innerText = jData.lsd.motifTypeName[mov.type];
    tr.appendChild(typeCell);

    let categoryCell = document.createElement("td");
    categoryCell.innerText = jData.locale.common.category_names[mov.category];
    tr.appendChild(categoryCell);

    let powerCell = document.createElement("td");
    powerCell.innerText = mov.power > 0 ? `${mov.power}\n-\n${Math.floor(mov.power * 1.2)}` : "—";

    tr.appendChild(powerCell);

    let accuracyCell = document.createElement("td");
    accuracyCell.innerText = mov.accuracy || "—";
    tr.appendChild(accuracyCell);

    let gaugeCell = document.createElement("td");
    gaugeCell.innerText = mov.gaugeDrain || "—";
    tr.appendChild(gaugeCell);

    let targetCell = document.createElement("td");
    targetCell.innerText = jData.lsd.moveTargetType[targetToId[mov.target]] || "—";
    tr.appendChild(targetCell);

    let descrCell = document.createElement("td");
    descrCell.innerText = getMoveDescr(moveId);
    tr.appendChild(descrCell);

    let limitCell = document.createElement("td");
    limitCell.innerText = mov.uses || "—";
    tr.appendChild(limitCell);

    return tr;
}

function getGMaxMoveRow(moveId) {
    let mov = jData.proto.move.find(m => m.moveId == moveId);

    let tr = document.createElement("tr");

    let nameCell = document.createElement("td");
    nameCell.innerText = jData.lsd.moveName[moveId];
    tr.appendChild(nameCell);

    let typeCell = document.createElement("td");
    typeCell.innerText = jData.lsd.motifTypeName[mov.type];
    tr.appendChild(typeCell);

    let categoryCell = document.createElement("td");
    categoryCell.innerText = jData.locale.common.category_names[mov.category];
    tr.appendChild(categoryCell);

    let powerCell = document.createElement("td");
    powerCell.innerText = mov.power > 0 ? `${mov.power}\n-\n${Math.floor(mov.power * 1.2)}` : "—";
    tr.appendChild(powerCell);

    let targetCell = document.createElement("td");
    targetCell.innerText = jData.lsd.moveTargetType[targetToId[mov.target]] || "—";
    tr.appendChild(targetCell);

    let descrCell = document.createElement("td");
    descrCell.innerText = getMoveDescr(moveId);
    tr.appendChild(descrCell);

    return tr;
}

function getSyncMoveRow(syncMoveId, tr) {
    let row = document.createElement("tr");
    let mov = jData.proto.move.find(m => m.moveId === syncMoveId);

    let nameCell = document.createElement("td");
    nameCell.innerText = jData.lsd.moveName[syncMoveId];
    row.appendChild(nameCell);

    let typeCell = document.createElement("td");
    typeCell.innerText = jData.lsd.motifTypeName[mov.type];
    row.appendChild(typeCell);

    let categoryCell = document.createElement("td");
    categoryCell.innerText = jData.locale.common.category_names[mov.category];
    row.appendChild(categoryCell);

    let powerCell = document.createElement("td");
    powerCell.innerText = mov.power > 0 ? `${mov.power}\n-\n${Math.floor(mov.power * 1.2)}` : "—";
    row.appendChild(powerCell);

    let targetCell = document.createElement("td");
    targetCell.innerText = jData.lsd.moveTargetType[targetToId[mov.target]] || "—";
    row.appendChild(targetCell);

    let effectCell = document.createElement("td");
    effectCell.innerText = getMoveDescr(syncMoveId);
    row.appendChild(effectCell);

    if (hasExUnlocked(tr.trainerId)) {
        let exEffectCell = document.createElement("td");
        exEffectCell.innerText = getExSyncEffect(tr.role, tr.type);
        row.appendChild(exEffectCell);
    }

    if (hasExRoleUnlocked(tr.trainerId)) {
        let exRoleEffectCell = document.createElement("td");
        exRoleEffectCell.innerText = getExSyncEffect(getExRoleId(tr.trainerId), tr.type);
        row.appendChild(exRoleEffectCell);
    }

    return row;
}

function setPairMoves(contentDiv, monsterId, variation = null) {
    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let movesH2 = document.createElement("h2");
    movesH2.innerText = jData.locale.syncPairs.moves_title;
    contentDiv.appendChild(movesH2);

    let headRow = document.createElement("tr");
    let headTitle = document.createElement("th");
    headTitle.innerText = jData.locale.syncPairs.moves;
    headTitle.colSpan = 9;
    headRow.appendChild(headTitle);
    table.appendChild(headRow);

    let titleRow = document.createElement("tr");

    let titleName = document.createElement("th");
    titleName.innerText = jData.locale.syncPairs.move_name;
    titleRow.appendChild(titleName);

    let titleType = document.createElement("th");
    titleType.innerText = jData.locale.syncPairs.move_type;
    titleRow.appendChild(titleType);

    let titleCategory = document.createElement("th");
    titleCategory.innerText = jData.locale.syncPairs.move_category;
    titleRow.appendChild(titleCategory);

    let titlePower = document.createElement("th");
    titlePower.innerText = jData.locale.syncPairs.move_power;
    titleRow.appendChild(titlePower);

    let titleAccuracy = document.createElement("th");
    titleAccuracy.innerText = jData.locale.syncPairs.move_accuracy;
    titleRow.appendChild(titleAccuracy);

    let titleGauge = document.createElement("th");
    titleGauge.innerText = jData.locale.syncPairs.move_gauge;
    titleRow.appendChild(titleGauge);

    let titleTarget = document.createElement("th");
    titleTarget.innerText = jData.locale.syncPairs.move_target;
    titleRow.appendChild(titleTarget);

    let titleEffect = document.createElement("th");
    titleEffect.innerText = jData.locale.syncPairs.move_description;
    titleRow.appendChild(titleEffect);

    let titleLimit = document.createElement("th");
    titleLimit.innerText = jData.locale.syncPairs.move_uses;
    titleRow.appendChild(titleLimit);

    table.appendChild(titleRow);

    let tr = jData.proto.trainer.find(t => t.trainerId === syncPairSelect.value);
    let mon = jData.proto.monster.find(m => m.monsterId === monsterId);

    for (let i = 1; i < 5; i++) {
        let moveId;

        if (variation && variation[`move${i}Id`] > -1) {
            moveId = variation[`move${i}Id`]
        } else if (mon && mon[`move${i}ChangeId`] > -1) {
            moveId = mon[`move${i}ChangeId`];
        } else {
            moveId = tr[`move${i}Id`];
        }

        if (moveId > -1) {
            table.appendChild(getMoveRow(moveId));
        }
    }

    let tableWrapper = document.createElement("div");
    tableWrapper.style.overflowX = "auto";
    tableWrapper.appendChild(table);
    contentDiv.appendChild(tableWrapper);

    // Capacités Duo Dynamax

    let gmaxVar = jData.proto.monsterVariation.find(mv => mv.monsterId === monsterId && mv.form === 4);

    if (gmaxVar) {
        contentDiv.appendChild(document.createElement("br"));

        let table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        let titleRow = document.createElement("tr");

        let titleDynamax = document.createElement("th");
        titleDynamax.innerText = jData.locale.syncPairs.max_moves;
        titleDynamax.colSpan = 6;
        titleRow.appendChild(titleDynamax);
        table.appendChild(titleRow);

        let headRow = document.createElement("tr");

        let headName = document.createElement("th");
        headName.innerText = jData.locale.syncPairs.move_name;
        headRow.appendChild(headName);

        let headType = document.createElement("th");
        headType.innerText = jData.locale.syncPairs.move_type;
        headRow.appendChild(headType);

        let headCategory = document.createElement("th");
        headCategory.innerText = jData.locale.syncPairs.move_category;
        headRow.appendChild(headCategory);

        let headPower = document.createElement("th");
        headPower.innerText = jData.locale.syncPairs.move_power;
        headRow.appendChild(headPower);

        let headTarget = document.createElement("th");
        headTarget.innerText = jData.locale.syncPairs.move_target;
        headRow.appendChild(headTarget);

        let headEffect = document.createElement("th");
        headEffect.innerText = jData.locale.syncPairs.move_description;
        headRow.appendChild(headEffect);

        table.appendChild(headRow);

        for (let i = 1; i < 5; i++) {
            let moveId = gmaxVar[`moveDynamax${i}Id`];

            if (moveId > -1) {
                table.appendChild(getGMaxMoveRow(moveId));
            }
        }

        let tableWrapperGMax = document.createElement("div");
        tableWrapperGMax.style.overflowX = "auto";
        tableWrapperGMax.appendChild(table);
        contentDiv.appendChild(tableWrapperGMax);
    }

    // Capacité Teracristal
    let teraMove = jData.proto.monsterVariation.find(mv => mv.monsterId === monsterId && mv.terastalMoveId > 0);

    if (teraMove) {
        contentDiv.appendChild(document.createElement("br"));

        let table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        let titleRow = document.createElement("tr");

        let titleTera = document.createElement("th");
        titleTera.innerText = jData.locale.syncPairs.tera_move;
        titleTera.colSpan = 9;
        titleRow.appendChild(titleTera);
        table.appendChild(titleRow);

        let headRow = document.createElement("tr");

        let headName = document.createElement("th");
        headName.innerText = jData.locale.syncPairs.move_name;
        headRow.appendChild(headName);

        let headType = document.createElement("th");
        headType.innerText = jData.locale.syncPairs.move_type;
        headRow.appendChild(headType);

        let headCategory = document.createElement("th");
        headCategory.innerText = jData.locale.syncPairs.move_category;
        headRow.appendChild(headCategory);

        let headPower = document.createElement("th");
        headPower.innerText = jData.locale.syncPairs.move_power;
        headRow.appendChild(headPower);

        let headAccuracy = document.createElement("th");
        headAccuracy.innerText = jData.locale.syncPairs.move_accuracy;
        headRow.appendChild(headAccuracy);

        let headGauges = document.createElement("th");
        headGauges.innerText = jData.locale.syncPairs.move_gauge;
        headRow.appendChild(headGauges);

        let headTarget = document.createElement("th");
        headTarget.innerText = jData.locale.syncPairs.move_target;
        headRow.appendChild(headTarget);

        let headEffect = document.createElement("th");
        headEffect.innerText = jData.locale.syncPairs.move_description;
        headRow.appendChild(headEffect);

        let headLimit = document.createElement("th");
        headLimit.innerText = jData.locale.syncPairs.move_uses;
        headRow.appendChild(headLimit);

        table.appendChild(headRow);

        table.appendChild(getMoveRow(teraMove.terastalMoveId));

        let tableWrapperTera = document.createElement("div");
        tableWrapperTera.style.overflowX = "auto";
        tableWrapperTera.appendChild(table);
        contentDiv.appendChild(tableWrapperTera);
    }

    contentDiv.appendChild(document.createElement("br"));

    table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    titleRow = document.createElement("tr");

    let titleSync = document.createElement("th");
    titleSync.innerText = jData.locale.syncPairs.sync_move;
    titleSync.colSpan = 6 + hasExUnlocked(syncPairSelect.value) + hasExRoleUnlocked(syncPairSelect.value);
    titleRow.appendChild(titleSync);
    table.appendChild(titleRow);

    headRow = document.createElement("tr");

    let syncHeadName = document.createElement("th");
    syncHeadName.innerText = jData.locale.syncPairs.move_name;
    headRow.appendChild(syncHeadName);

    let syncHeadType = document.createElement("th");
    syncHeadType.innerText = jData.locale.syncPairs.move_type;
    headRow.appendChild(syncHeadType);

    let syncHeadCategory = document.createElement("th");
    syncHeadCategory.innerText = jData.locale.syncPairs.move_category;
    headRow.appendChild(syncHeadCategory);

    let syncHeadPower = document.createElement("th");
    syncHeadPower.innerText = jData.locale.syncPairs.move_power;
    headRow.appendChild(syncHeadPower);

    let syncHeadTarget = document.createElement("th");
    syncHeadTarget.innerText = jData.locale.syncPairs.move_target;
    headRow.appendChild(syncHeadTarget);

    let syncHeadEffect = document.createElement("th");
    syncHeadEffect.innerText = jData.locale.syncPairs.move_description;
    headRow.appendChild(syncHeadEffect);

    if (hasExUnlocked(syncPairSelect.value)) {
        let syncHeadExEffect = document.createElement("th");
        syncHeadExEffect.innerText = jData.locale.syncPairs.sync_move_ex_title;
        headRow.appendChild(syncHeadExEffect);
    }

    if (hasExRoleUnlocked(syncPairSelect.value)) {
        let syncHeadExRoleEffect = document.createElement("th");
        syncHeadExRoleEffect.innerText = jData.locale.syncPairs.sync_move_ex_role_title;
        headRow.appendChild(syncHeadExRoleEffect);
    }

    table.appendChild(headRow);
    table.appendChild(getSyncMoveRow(mon.syncMoveId, tr));

    let tableWrapperSync = document.createElement("div");
    tableWrapperSync.style.overflowX = "auto";
    tableWrapperSync.appendChild(table);
    contentDiv.appendChild(tableWrapperSync);
}

function appendGridCategory(table, panels, category) {
    panels = panels.filter(p => p.type === category)
        .sort((a, b) => a.level - b.level || a.cellId - b.cellId);

    if (panels.length === 0)
        return;

    let headRow = document.createElement("tr");

    let categoryName = document.createElement("th");
    categoryName.style.backgroundColor = abilityTypeBGColor[category];
    categoryName.colSpan = 5;
    categoryName.innerText = jData.locale.syncPairs.sync_grid_ability_type_title[category];
    headRow.appendChild(categoryName);
    table.appendChild(headRow);

    panels.forEach(p => {
        let tr = document.createElement("tr");

        if (p.isNew) {
            tr.style.backgroundColor = "#7afa96";
        }

        let ameliorationCell = document.createElement("td");

        ameliorationCell.innerHTML = jData.lsd.abilityName[p.ability.type]
            .replace("[Digit:5digits ]", "+" + p.ability.value)
            .replace("[Name:Ability ]", getDetailedPassiveSkillName(p.ability.passiveId))
            .replace("[Name:Move ]", jData.lsd.moveName[p.ability.moveId]).replace("\n", " ");



        tr.appendChild(ameliorationCell);

        let effectCell = document.createElement("td");
        if (p.ability.type === 11) {
            effectCell.appendChild(getTooltipMoveData(p.ability.moveId));
        }
        else if (p.ability.passiveId) {
            effectCell.innerText = getPassiveSkillDescr(p.ability.passiveId);
        }
        else {
            effectCell.innerText = "—";
        }
        tr.appendChild(effectCell);

        let energyCell = document.createElement("td");
        energyCell.innerText = p.energyCost || "—";
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

function suppressCellData(cell) {
    let orbCell = document.getElementById("orbCell");
    let energyCell = document.getElementById("energyCell");
    let cellId = cell.getAttribute("data-cell-id");
    let tileDiv = document.getElementById(`tile-${cellId}`);

    cell.removeAttribute("selected");

    orbCell.innerText = (parseInt(orbCell.innerText) - parseInt(cell.getAttribute("data-orbs"))).toString();
    energyCell.innerText = (parseInt(energyCell.innerText) + parseInt(cell.getAttribute("data-energy"))).toString();
    if (tileDiv) tileDiv.remove();
}

function setTileBackground(g) {
    let bgLayer = g.querySelector(".bg-layer");
    let iconLayer = g.querySelector(".icon-layer");
    let overlayLayer = g.querySelector(".overlay-layer");

    let tileIcon;
    let panelType = g.getAttribute("data-panel-type") || g.getAttribute("data-category");
    let dataLevel = g.getAttribute("data-level");

    if (dataLevel && dataLevel > syncLevel) {
        tileIcon = `locked-${dataLevel}`;

        if (g.getAttribute("selected") !== null) {
            suppressCellData(g)
        }
    }
    else {
        tileIcon = g.getAttribute("data-category");

        if (g.getAttribute("data-type") !== null) {
            tileIcon += `-${g.getAttribute("data-type")}`;
        }
    }

    if (g.getAttribute("selected") !== null) {
        overlayLayer.style.display = "block";

        let selectedSuffix = (panelType === 'arceuspanel' ? '' : '-selected');
        iconLayer.setAttribute("href", `./data/sync-grids/icons/${tileIcon + selectedSuffix}.png`);
        bgLayer.setAttribute("href", `./data/sync-grids/${panelType}-selected.png`);
    }
    else {
        overlayLayer.style.display = "none";
        iconLayer.setAttribute("href", `./data/sync-grids/icons/${tileIcon}.png`);
        bgLayer.setAttribute("href", `./data/sync-grids/${panelType}.png`);
    }
}

function changeSelection(g) {

    if (g.getAttribute("selected") !== null) {
        suppressCellData(g);
    }
    else {
        let orbCell = document.getElementById("orbCell");
        let energyCell = document.getElementById("energyCell");
        let cellId = g.getAttribute("data-cell-id");
        let tilesCell = document.getElementById("tilesCell");
        let tileDiv = document.createElement("div");

        const passiveId = g.getAttribute("data-passive-id");

        tileDiv.id = `tile-${cellId}`;
        tileDiv.innerHTML = passiveId === "0" ? g.getAttribute("data-tile-name") : getDetailedPassiveSkillName(passiveId);
        tileDiv.style.background = "rgba(0, 0, 0, 0.1)";
        tileDiv.style.margin = "3px auto";

        g.setAttribute("selected", '');

        orbCell.innerText = (parseInt(orbCell.innerText) + parseInt(g.getAttribute("data-orbs"))).toString();
        energyCell.innerText = (parseInt(energyCell.innerText) - parseInt(g.getAttribute("data-energy"))).toString();
        tilesCell.appendChild(tileDiv);

    }

    setTileBackground(g);

    syncGridShareManager.dirty = true;
}

function setGridPicker(ap, gridPickerDiv) {
    let gridWrapper = document.createElement("div");
    let gridDiv = document.createElement("div");

    let pickerDiv = document.createElement("div");

    gridPickerDiv.style.display = "flex";
    gridPickerDiv.style.justifyContent = "center";
    gridPickerDiv.style.flexWrap = "wrap"; // Allow wrapping for responsiveness
    gridPickerDiv.style.alignItems = "flex-start"; // Align items to top

    gridWrapper.style.margin = "0";
    gridWrapper.style.overflow = "auto"; // Enable scrolling for responsiveness
    gridWrapper.style.maxWidth = "100%"; // Ensure it doesn't overflow the screen width
    gridWrapper.style.flex = "0 1 auto"; // Don't grow, allow shrinking. Keeps it close to pickerDiv.
    gridWrapper.style.textAlign = "center"; // Center the gridDiv inside

    pickerDiv.style.margin = "auto 25px";
    pickerDiv.style.flex = "0 0 auto"; // Keep natural size, wrap if needed

    gridWrapper.appendChild(gridDiv);
    gridPickerDiv.appendChild(gridWrapper);
    gridPickerDiv.appendChild(pickerDiv);

    // Move zoom controls to be inside gridPickerDiv but before gridWrapper
    // (This is handled in the main replacement block, but ensuring gridWrapper styles here)

    let maxX = 0, maxY = 0, maxZ = 0, minX = 0, minY = 0, minZ = 0;

    ap.forEach(panel => {
        if (panel.x > maxX) maxX = panel.x;
        if (panel.x < minX) minX = panel.x;
        if (panel.y > maxY) maxY = panel.y;
        if (panel.y < minY) minY = panel.y;
        if (panel.z > maxZ) maxZ = panel.z;
        if (panel.z < minZ) minZ = panel.z;
    });

    let allPanels = [...ap, { x: 0, y: 0, z: 0, isCenter: true }];

    let xValues = allPanels.map(p => p.x * 51);
    let yValues = allPanels.map(p => (p.y - p.z) * 30);

    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);

    let totalWidth = (xMax - xMin) + 69;
    let totalHeight = (yMax - yMin) + 60;

    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", totalWidth);
    svg.setAttribute("height", totalHeight);
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
    svg.style.display = "block";
    svg.style.transformOrigin = "top left";
    svg.style.transition = "transform 0.2s ease";

    let tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    tooltip.style.display = "none";
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = "1000"; // High z-index to sit on top of everything
    tooltip.style.pointerEvents = "none";
    document.body.appendChild(tooltip); // Append to body to avoid clipping

    // Zoom and Auto-Resize Logic
    let currentZoom = 1;

    const updateZoom = () => {
        svg.style.transform = `scale(${currentZoom})`;
        gridDiv.style.width = `${totalWidth * currentZoom}px`;
        gridDiv.style.height = `${totalHeight * currentZoom}px`;
    };

    // Auto-resize observer (only when not manually zooming)
    let isManuallyZooming = false;
    const resizeObserver = new ResizeObserver(entries => {
        if (isManuallyZooming) return; // Don't auto-resize during manual zoom

        for (let entry of entries) {
            const availableWidth = entry.contentRect.width;
            if (availableWidth > 0 && availableWidth < totalWidth) {
                currentZoom = availableWidth / totalWidth;
            } else {
                currentZoom = 1;
            }
            updateZoom();
        }
    });

    resizeObserver.observe(gridWrapper);

    // Pinch-to-Zoom Logic
    let initialPinchDistance = null;
    let initialZoom = null;
    let pinchCenterX = null;
    let pinchCenterY = null;

    gridWrapper.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            isManuallyZooming = true; // Disable auto-resize
            initialPinchDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            initialZoom = currentZoom;

            // Calculate pinch center point relative to gridWrapper
            const rect = gridWrapper.getBoundingClientRect();
            pinchCenterX = ((e.touches[0].pageX + e.touches[1].pageX) / 2) - rect.left + gridWrapper.scrollLeft;
            pinchCenterY = ((e.touches[0].pageY + e.touches[1].pageY) / 2) - rect.top + gridWrapper.scrollTop;
        }
    }, { passive: false });

    gridWrapper.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialPinchDistance !== null) {
            e.preventDefault(); // Prevent page zoom
            const currentDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );

            const scaleFactor = currentDistance / initialPinchDistance;
            // Amplify the zoom response for easier zooming (1.2x multiplier for smoother control)
            const amplifiedFactor = 1 + (scaleFactor - 1) * 1.2;
            let newZoom = initialZoom * amplifiedFactor;

            // Limit zoom levels (allow up to 3x for detailed viewing with scrolling)
            if (newZoom < 0.2) newZoom = 0.2;
            if (newZoom > 3) newZoom = 3;

            currentZoom = newZoom;
            updateZoom();

            // Calculate scroll adjustment to keep pinch center fixed
            // The pinch center should remain at the same position in the viewport
            const rect = gridWrapper.getBoundingClientRect();
            const viewportCenterX = ((e.touches[0].pageX + e.touches[1].pageX) / 2) - rect.left;
            const viewportCenterY = ((e.touches[0].pageY + e.touches[1].pageY) / 2) - rect.top;

            gridWrapper.scrollLeft = pinchCenterX * (newZoom / initialZoom) - viewportCenterX;
            gridWrapper.scrollTop = pinchCenterY * (newZoom / initialZoom) - viewportCenterY;
        }
    }, { passive: false });

    gridWrapper.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
            initialZoom = null;
            pinchCenterX = null;
            pinchCenterY = null;
            // Keep manual zoom active for a bit to prevent auto-resize from immediately resetting
            setTimeout(() => {
                isManuallyZooming = false;
            }, 800);
        }
    });

    // Create layers for Z-indexing
    let visualsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let interactionLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");

    svg.appendChild(visualsLayer);
    svg.appendChild(interactionLayer);

    gridDiv.appendChild(svg);
    gridDiv.style.position = "relative";
    gridDiv.style.overflow = "hidden"; // Contain the scaled SVG
    gridDiv.id = "gridDiv";

    const addTile = (panel, isCenter) => {
        // Visual Group (Images)
        let gVisual = document.createElementNS("http://www.w3.org/2000/svg", "g");
        // Interaction Group (Polygon)
        let gInteraction = document.createElementNS("http://www.w3.org/2000/svg", "g");

        let pX = panel.x * 51;
        let pY = (panel.y - panel.z) * 30;

        let svgX = pX - xMin;
        let svgY = totalHeight - (pY - yMin) - 60;

        gVisual.setAttribute("transform", `translate(${svgX}, ${svgY})`);
        gInteraction.setAttribute("transform", `translate(${svgX}, ${svgY})`);

        let bgImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
        bgImg.setAttribute("width", "69");
        bgImg.setAttribute("height", "60");
        bgImg.classList.add("bg-layer");

        let iconImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
        iconImg.setAttribute("width", "69");
        iconImg.setAttribute("height", "60");
        iconImg.classList.add("icon-layer");

        let overlayImg = document.createElementNS("http://www.w3.org/2000/svg", "image");
        overlayImg.setAttribute("width", "69");
        overlayImg.setAttribute("height", "60");
        overlayImg.setAttribute("href", "./data/sync-grids/selected-overlay.png");
        overlayImg.classList.add("overlay-layer");
        overlayImg.style.display = "none";

        let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        // Standard hexagon points
        polygon.setAttribute("points", "17,0 52,0 69,30 52,60 17,60 0,30");
        polygon.setAttribute("style", "fill: white; fill-opacity: 0; cursor: pointer; pointer-events: all;");

        if (isCenter) {
            bgImg.setAttribute("href", "./data/sync-grids/center.png");
            gVisual.appendChild(bgImg);
        } else {
            gVisual.appendChild(bgImg);
            gVisual.appendChild(iconImg);
            gVisual.appendChild(overlayImg);

            // Polygon goes to interaction group
            gInteraction.appendChild(polygon);

            if (panel.level > 1) gVisual.setAttribute("data-level", panel.level);

            switch (panel.ability.type) {
                case 1: case 2: case 3: case 4: case 5: case 6:
                    gVisual.setAttribute("data-category", "statsup");
                    break;
                case 7:
                    gVisual.setAttribute("data-category", "passiveskill");
                    break;
                case 8:
                    gVisual.setAttribute("data-category", "moveeffect");
                    break;
                case 9: case 10:
                    let m = jData.proto.move.find(m => m.moveId === panel.ability.moveId);
                    if (m.group === "Sync") {
                        gVisual.setAttribute("data-category", "syncmove");
                    } else if (m.group === "Maxmove") {
                        gVisual.setAttribute("data-category", "maxmove");
                    } else {
                        gVisual.setAttribute("data-type", m.type.toString());
                        gVisual.setAttribute("data-category", "movepowerup");
                    }
                    break;
                case 11:
                    gVisual.setAttribute("data-category", "learnmove");
            }

            if (panel.conditionIds.filter(cid => cid >= 16 && cid <= 19).length > 0) {
                gVisual.setAttribute("data-panel-type", "arceuspanel");
            }

            gVisual.setAttribute("data-energy", panel.energyCost);
            gVisual.setAttribute("data-orbs", panel.orbCost);
            gVisual.setAttribute("data-items", panel.items.join(","));
            gVisual.setAttribute("data-cell-id", panel.cellId);
            gVisual.setAttribute("data-passive-id", panel.ability.passiveId);

            let text = jData.lsd.abilityName[panel.ability.type]
                .replace("[Digit:5digits ]", "+" + panel.ability.value)
                .replace("[Name:Ability ]", getPassiveSkillName(panel.ability.passiveId))
                .replace("[Name:Move ]", jData.lsd.moveName[panel.ability.moveId]).replace("\n", " ");

            gVisual.setAttribute("data-tile-name", text);

            polygon.addEventListener("click", () => changeSelection(gVisual));

            polygon.addEventListener("mouseenter", (e) => {
                if (panel.level <= syncLevel) {
                    polygon.style.fillOpacity = "0.25";
                } else {
                    polygon.style.cursor = "default";
                }

                tooltip.innerHTML = "";
                let titleP = document.createElement("p");
                titleP.style.textAlign = "center";
                titleP.innerHTML = `<b>${text}</b>`;
                tooltip.appendChild(titleP);

                if (panel.ability.type === 11) {
                    tooltip.appendChild(getTooltipMoveData(panel.ability.moveId));
                } else if (panel.ability.passiveId) {
                    tooltip.innerHTML += `<p><b>${jData.locale.syncPairs.sync_grid_tile_description_tooltip}:</b> ${getPassiveSkillDescr(panel.ability.passiveId)}`;
                }

                tooltip.innerHTML += `<p><b>${jData.locale.syncPairs.sync_grid_tile_items_tooltip}:</b><br />${panel.items.join("<br />")}</p>`;
                tooltip.innerHTML += `<p><b>${jData.locale.syncPairs.sync_grid_tile_energy_tooltip}:</b> ${panel.energyCost}</p>`;

                tooltip.style.display = "block";

                // Calculate position relative to viewport + scroll
                const tileRect = gVisual.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();

                // Center horizontally over the tile
                let left = tileRect.left + (tileRect.width / 2) - (tooltipRect.width / 2) + window.scrollX;

                // Position above the tile
                let top = tileRect.top - tooltipRect.height - 10 + window.scrollY;

                // Flip if going off-screen (top edge)
                if (top < window.scrollY) {
                    top = tileRect.bottom + 10 + window.scrollY;
                    tooltip.classList.add("flipped");
                } else {
                    tooltip.classList.remove("flipped");
                }

                // Adjust if going off-screen (left edge)
                if (left < 0) left = 0;

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
                tooltip.style.bottom = "auto";
            });

            polygon.addEventListener("mouseleave", () => {
                polygon.style.fillOpacity = "0";
                tooltip.style.display = "none";
            });

            setTileBackground(gVisual);
        }

        visualsLayer.appendChild(gVisual);
        interactionLayer.appendChild(gInteraction);
    };

    addTile({ x: 0, y: 0, z: 0 }, true);
    ap.forEach(p => addTile(p, false));

    let controlTbl = document.createElement("table");
    controlTbl.classList.add("bipcode");
    controlTbl.style.textAlign = "center";
    controlTbl.style.width = "250px";

    let tr = document.createElement("tr");
    let capaTitle = document.createElement("th");
    capaTitle.innerText = jData.locale.syncPairs.sync_pair_level;
    capaTitle.colSpan = 2;

    tr.appendChild(capaTitle);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let capaCell = document.createElement("td");
    capaCell.colSpan = 2;

    let levelContainer = document.createElement("span");
    levelContainer.style.display = "flex";
    levelContainer.style.justifyContent = "space-around";

    for (let i = 1; i < 6; i++) {
        let levelDiv = document.createElement("div");
        levelDiv.style.backgroundImage = `url("./data/sync-grids/icons/level${i > syncLevel ? "-off" : ""}.png")`;
        levelDiv.style.backgroundRepeat = "no-repeat";
        levelDiv.style.backgroundSize = "contain";
        levelDiv.style.cursor = "pointer";
        levelDiv.style.width = "30px";
        levelDiv.style.height = "27px";
        levelDiv.style.order = i.toString();
        levelDiv.setAttribute("data-sync-level", `${i}`);
        levelDiv.id = `syncLevel${i}`

        levelDiv.addEventListener("click", () => {
            syncLevel = i;

            for (let j = 1; j < 6; j++) {
                document.getElementById(`syncLevel${j}`).style.backgroundImage = `url("./data/sync-grids/icons/level${j > syncLevel ? "-off" : ""}.png")`;
            }

            let tiles = document.querySelectorAll(`[data-level]`);

            tiles.forEach(setTileBackground);
        });

        levelContainer.appendChild(levelDiv);
    }

    capaCell.appendChild(levelContainer);
    tr.appendChild(capaCell);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let energyLimitTitle = document.createElement("th");
    energyLimitTitle.innerText = jData.locale.syncPairs.sync_grid_energy_level;
    energyLimitTitle.colSpan = 2;

    tr.appendChild(energyLimitTitle);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let energyLimitCell = document.createElement("td");
    energyLimitCell.colSpan = 2;

    let energyContainer = document.createElement("div");
    energyContainer.classList.add("radio-container");

    let radioTileGroup = document.createElement("div");
    radioTileGroup.classList.add("radio-tile-group");

    for (let i = 0; i < 6; i++) {
        let inputContainer = document.createElement("div");
        inputContainer.classList.add("input-container");

        let input = document.createElement("input");
        input.id = `energy-${60 + (i * 2)}`;
        input.classList.add("radio-button");
        input.type = "radio";
        input.name = "energy-radio";

        input.addEventListener("click", () => {
            let oldMax = maxEnergy;
            maxEnergy = 60 + (i * 2);

            let energyCell = document.getElementById("energyCell");
            energyCell.innerText = (parseInt(energyCell.innerText) + maxEnergy - oldMax).toString();
        })

        if (i === 0) {
            input.checked = true;
            maxEnergy = 60;
        }

        let radioTile = document.createElement("div");
        radioTile.classList.add("radio-tile");

        let radioLabel = document.createElement("label");
        radioLabel.setAttribute("for", `energy-${60 + (i * 2)}`);
        radioLabel.classList.add("radio-tile-label");
        radioLabel.innerText = `${60 + (i * 2)}`

        radioTile.appendChild(radioLabel);

        inputContainer.appendChild(input);
        inputContainer.appendChild(radioTile);

        radioTileGroup.appendChild(inputContainer);
    }

    energyContainer.appendChild(radioTileGroup);

    energyLimitCell.appendChild(energyContainer);
    tr.appendChild(energyLimitCell);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let orbTitle = document.createElement("th");
    orbTitle.innerText = jData.locale.syncPairs.sync_orbs;

    let energyTitle = document.createElement("th");
    energyTitle.innerText = jData.locale.syncPairs.sync_grid_energy;

    tr.appendChild(orbTitle);
    tr.appendChild(energyTitle);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let orbCell = document.createElement("td");
    orbCell.id = "orbCell";
    orbCell.innerText = "0";
    orbCell.style.fontWeight = "bold";

    let energyCell = document.createElement("td");
    energyCell.id = "energyCell";
    energyCell.innerText = maxEnergy.toString();
    energyCell.style.fontWeight = "bold";

    tr.appendChild(orbCell);
    tr.appendChild(energyCell);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let tilesTitle = document.createElement("th");
    tilesTitle.innerText = jData.locale.syncPairs.sync_grid_selected_tiles;
    tilesTitle.colSpan = 2;

    tr.appendChild(tilesTitle);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let tilesCell = document.createElement("td");
    tilesCell.id = "tilesCell";
    tilesCell.colSpan = 2;
    tilesCell.style.fontWeight = "bold";

    tr.appendChild(tilesCell);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");
    let toolsTitle = document.createElement("th");
    toolsTitle.innerText = jData.locale.syncPairs.sync_grid_tools;
    toolsTitle.colSpan = 2;

    tr.appendChild(toolsTitle);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");

    let resetCell = document.createElement("td");
    resetCell.id = "resetCell";

    let resetButton = document.createElement("button");
    resetButton.innerText = jData.locale.syncPairs.sync_grid_reset;
    resetButton.classList.add("blueBtn");
    resetButton.addEventListener("click",
        () => [...document.querySelectorAll("g[selected]")]
            .forEach(svg => {
                suppressCellData(svg);
                setTileBackground(svg);
            })
    );

    resetCell.appendChild(resetButton);

    tr.appendChild(resetCell);

    let exportCell = document.createElement("td");
    exportCell.id = "exportCell";

    let exportButton = document.createElement("button");
    exportButton.innerText = jData.locale.syncPairs.sync_grid_export;
    exportButton.classList.add("orangeBtn");
    exportButton.addEventListener("click", () =>
        domtoimage.toPng(document.getElementById("gridDiv"))
            .then(function (dataUrl) {
                saveAs(dataUrl, "sync-grid.png");
            })
    );

    exportCell.appendChild(exportButton);
    tr.appendChild(exportCell);
    controlTbl.appendChild(tr);

    tr = document.createElement("tr");

    let copyUrlCell = document.createElement("td");
    copyUrlCell.id = "copyUrlCell";
    let copyUrlButton = document.createElement("button");
    copyUrlButton.innerText = jData.locale.syncPairs.sync_grid_copy_url;
    copyUrlButton.classList.add("orangeBtn");
    copyUrlButton.addEventListener("click", () => {
        syncGridShareManager.copyUrl().then((res) => {
            if (res)
                showToast(jData.locale.syncPairs.copy_success, "success");
            else
                showToast(jData.locale.syncPairs.copy_failure, "error");
        });
    });
    copyUrlCell.appendChild(copyUrlButton);
    tr.appendChild(copyUrlCell);
    controlTbl.appendChild(tr);

    let shareCell = document.createElement("td");
    shareCell.id = "shareCell";
    let shareButton = document.createElement("button");
    shareButton.innerText = jData.locale.syncPairs.sync_grid_share;
    shareButton.classList.add("orangeBtn");
    shareButton.addEventListener("click", syncGridShareManager.shareBuild);
    shareCell.appendChild(shareButton);
    tr.appendChild(shareCell);
    controlTbl.appendChild(tr);

    pickerDiv.appendChild(controlTbl);

    syncGridShareManager.init(gridDiv);
}

function setSyncGrid() {

    let charaScheduleId = jData.proto.schedule.map(s => s.scheduleId);
    let ap = jData.proto.abilityPanel.filter(ap => ap.trainerId === syncPairSelect.value)
        .map(ap => {
            ap.ability = jData.proto.ability.find(a => a.abilityId === ap.abilityId);
            ap.level = 1;
            ap.conditionIds.forEach(cid => {
                let releaseCon = jData.proto.abilityReleaseCondition.find(arc => arc.conditionId === cid);

                switch (releaseCon.type) {
                    case 6:
                    case 7:
                        ap.level = releaseCon.parameter;
                }
            });
            ap.items = [];
            if (ap.orbCost > 0) {
                ap.items.push(`${jData.lsd.abilityItemName["2"]} x${ap.orbCost}`);
            }
            ap.releaseItemSet = jData.proto.abilityPanelReleaseItemSet.find(a => a.abilityPanelId === ap.cellId);
            for (let i = 1; ap.releaseItemSet && ap.releaseItemSet[`item${i}`] !== "0" && i <= 3; i++) {
                ap.items.push(`${getItemName(ap.releaseItemSet[`item${i}`])} x${ap.releaseItemSet[`item${i}Qty`]}`);
            }
            ap.type = getAbilityType(ap.ability);
            ap.isNew = charaScheduleId.includes(ap.scheduleId);
            return ap;
        })
        .reduce((acc, curr) => {
            let cell = acc.find(a => a.cellId === curr.cellId);

            if (cell) {
                if (cell.version < curr.version) {
                    acc = acc.filter(a => a.cellId !== curr.cellId);
                    acc.push(curr);
                }

                return acc;
            }

            acc = acc.concat(curr);
            return acc;
        }, []);

    if (ap.length === 0)
        return;

    let container = document.getElementById("syncGridContainer");
    let gridPickerDiv = document.createElement("div");
    gridPickerDiv.style.textAlign = "center";

    setGridPicker(ap, gridPickerDiv);

    container.innerHTML = `<br /><h2>${jData.locale.syncPairs.sync_grid_title} (${ap.length} ${jData.locale.syncPairs.sync_grid_tiles})</h2>`;
    container.appendChild(gridPickerDiv);
    container.appendChild(document.createElement("br"));

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let headRow = document.createElement("tr");

    let upgradeTitle = document.createElement("th");
    upgradeTitle.innerText = jData.locale.syncPairs.sync_grid_tile_upgrade_title;
    headRow.appendChild(upgradeTitle);

    let effectTitle = document.createElement("th");
    effectTitle.innerText = jData.locale.syncPairs.sync_grid_tile_description_title;
    headRow.appendChild(effectTitle);

    let energyTitle = document.createElement("th");
    energyTitle.innerText = jData.locale.syncPairs.sync_grid_tile_required_energy_title;
    headRow.appendChild(energyTitle);

    let spheresTitle = document.createElement("th");
    spheresTitle.innerText = jData.locale.syncPairs.sync_grid_tile_required_orbs_title;
    headRow.appendChild(spheresTitle);

    let trainerLevelTitle = document.createElement("th");
    trainerLevelTitle.innerText = jData.locale.syncPairs.sync_grid_tile_required_pair_level_title;
    headRow.appendChild(trainerLevelTitle);

    table.appendChild(headRow);

    Object.keys(abilityType).forEach(key => appendGridCategory(table, ap, abilityType[key]));

    let tableWrapper = document.createElement("div");
    tableWrapper.style.overflowX = "auto";
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);

    syncGridShareManager.refresh();

    const initial = syncGridShareManager.readTokenFromURL();
    if (initial) {
        syncGridShareManager.applyState(initial);

        requestAnimationFrame(() => {
            const target = document.querySelector('#gridDiv');
            if (target) {
                window.scrollTo({
                    top: target.getBoundingClientRect().top + window.scrollY - 125,
                    behavior: 'smooth'
                });
            }
        })
    }
}

function setTabContent(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation = null) {
    setPairOverview(contentDiv, monsterName, monsterId, monsterBaseId, variation);
    setPairStats(contentDiv, monsterName, monsterId, monsterBaseId, formId, variation);
    setPairSuperAwakening(contentDiv);
    setPairPassives(contentDiv, variation);
    setPairTeamSkills(contentDiv);
    setPairLuckySkills(contentDiv);
    setPairMoves(contentDiv, monsterId, variation);
}

function createTab(monsterId, monTabs, tabContentDiv, pushState = false, isDefault = false, variation = null) {
    let monsterBaseId = 0;
    let formId = 0;
    let monsterName;

    if (variation) {
        formId = variation.formId;
        monsterBaseId = getMonsterBaseIdFromActorId(variation.actorId);
        monsterName = getNameByMonsterBaseId(monsterBaseId, formId);
    } else {
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

    if (isDefault) {
        switchTab(monsterId, monsterBaseId, formId, pushState);
    }
}

function setPairInfos(id, pushState = false) {
    let pairEvolutions = jData.proto.monsterEvolution.filter(me => me.trainerId === id);
    let monsterIds = [];
    let pairVariations = {};

    let title = document.createElement("h1");
    title.textContent = getPairName(id);

    syncPairDiv.innerHTML = "";
    syncPairDiv.appendChild(title);

    if (NOT_IMPLEMENTED.includes(id)) {
        let warning = document.createElement("div");
        warning.style.backgroundColor = "red";
        warning.style.color = "white";
        warning.style.textAlign = "center";
        warning.style.fontSize = "2em";
        warning.style.padding = "5px";
        warning.style.fontWeight = "bold";
        warning.style.marginBottom = "20px";

        warning.innerText = "WARNING : This sync pair has some new features that are not fully supported yet. Some information might change after I'm done adding support for it!";

        syncPairDiv.appendChild(warning);
    }

    let monTabs = document.createElement("div");
    monTabs.classList.add("tab");
    syncPairDiv.appendChild(monTabs);

    let tabContentDiv = document.createElement("div");
    tabContentDiv.id = "tabContentDiv";
    syncPairDiv.appendChild(tabContentDiv);

    monsterIds.push(jData.proto.trainer.find(t => t.trainerId === id).monsterId);
    pairEvolutions.forEach(pe => monsterIds.push(pe.monsterIdNext));

    for (let i = 0; i < monsterIds.length; i++) {
        if (i === (monsterIds.length - 1)) {
            createTab(monsterIds[i], monTabs, tabContentDiv, pushState, true);
        } else {
            createTab(monsterIds[i], monTabs, tabContentDiv, pushState);
        }

        let variations = jData.proto.monsterVariation.filter(mv => mv.monsterId === monsterIds[i]);
        let enhancements = jData.proto.monsterEnhancement.filter(me => me.monsterIdCurrent === monsterIds[i] && me.type !== "2");

        if (enhancements.length > 0) {
            enhancements.forEach(e => {
                variations.push(...jData.proto.monsterVariation.filter(mv => mv.monsterId === e.monsterIdNext));
            });
        }

        if (variations.length > 0) {
            pairVariations[monsterIds[i]] = variations;

            for (const v of variations) {
                if (v.form !== 4)    // Ne pas inclure les Gigamax
                    createTab(monsterIds[i], monTabs, tabContentDiv, pushState, false, v)
            }
        }
    }

    setSyncGrid();

    if (isAdminMode) {
        dataArea.value = getPairBipCode(syncPairSelect.value);
    }
}

function setUrlMonsterInfos(monsterId, baseId, formId, pushState) {

    const url = new URL(window.location);

    if (url.searchParams.get('pair') !== syncPairSelect.value) {
        url.searchParams.set('pair', syncPairSelect.value);
    }

    url.searchParams.set('monsterId', monsterId);
    url.searchParams.set('baseId', baseId);
    url.searchParams.set('formId', formId);
    url.hash = "";

    if (pushState)
        window.history.pushState(null, '', url.toString());
}

function setLatestPairs() {
    lastReleasePairsDiv = document.getElementById('lastReleasedPairs');

    let newTrainers = jData.proto.trainer
        .map(t => {
            // Scout Method 4 === Gym, ScheduleId at FOREVER === Release of the update
            if (t.scoutMethod === 4 && t.scheduleId === "FOREVER") {
                t.scheduleId = gymStartScheduleId;
            }

            return t;
        })
        .filter(t => jData.proto.schedule.map(s => s.scheduleId).includes(t.scheduleId))
        .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));

    let h2 = document.createElement("h2");
    h2.innerText = jData.locale.syncPairs.last_update;
    lastReleasePairsDiv.appendChild(h2);

    let addedH3 = document.createElement("h3");
    addedH3.innerText = jData.locale.syncPairs.pairs_added;
    lastReleasePairsDiv.appendChild(addedH3);

    let ul = document.createElement("ul");

    for (const tr of newTrainers) {
        if (!landingPairId) {
            landingPairId = tr.trainerId;
        }

        let li = document.createElement("li");
        let b = document.createElement("b");
        let anchor = document.createElement("a");

        let url = new URL(window.location);
        url.searchParams.delete('monsterId');
        url.searchParams.delete('baseId');
        url.searchParams.delete('formId');
        url.searchParams.delete('build');
        url.searchParams.set('pair', tr.trainerId);
        url.hash = "";

        anchor.href = url.toString();
        anchor.textContent = getPairName(tr.trainerId);
        anchor.addEventListener("click", (e) => {
            e.preventDefault();
            syncPairSelect.value = tr.trainerId;
            selectChange();
        });

        b.appendChild(anchor);
        li.appendChild(b);
        ul.appendChild(li);
    }

    lastReleasePairsDiv.appendChild(ul);

    let gridH3 = document.createElement("h3");
    gridH3.innerText = jData.locale.syncPairs.extended_grids;
    lastReleasePairsDiv.appendChild(gridH3);

    let updatedGridTrainer = [...new Set(jData.proto.abilityPanel.filter(ap => jData.proto.schedule.map(s => s.scheduleId).includes(ap.scheduleId)).map(ap => ap.trainerId))]

    updatedGridTrainer = updatedGridTrainer.map(tid => {
        let trainerPanels = jData.proto.abilityPanel.filter(ap => ap.trainerId === tid);
        return {
            "trainerId": tid,
            "new": trainerPanels.length,
            "old": trainerPanels.filter(tp => !jData.proto.schedule.map(s => s.scheduleId).includes(tp.scheduleId)).length
        };
    });

    ul = document.createElement("ul");

    for (const ugt of updatedGridTrainer) {
        let li = document.createElement("li");
        let b = document.createElement("b");
        let anchor = document.createElement("a");

        let url = new URL(window.location);
        url.searchParams.delete('monsterId');
        url.searchParams.delete('baseId');
        url.searchParams.delete('formId');
        url.searchParams.delete('build');
        url.searchParams.set('pair', ugt.trainerId);
        url.hash = "";

        anchor.href = url.toString();

        anchor.innerText = `${getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})`;
        anchor.addEventListener("click", (e) => {
            e.preventDefault();
            syncPairSelect.value = ugt.trainerId;
            selectChange();
        });

        b.appendChild(anchor);
        li.appendChild(b);
        ul.appendChild(li);
    }

    lastReleasePairsDiv.appendChild(ul);
}

function selectChange() {
    const url = new URL(window.location);
    url.searchParams.delete('monsterId');
    url.searchParams.delete('baseId');
    url.searchParams.delete('formId');
    url.searchParams.delete('build');
    url.searchParams.set('pair', syncPairSelect.value);


    window.history.pushState(null, '', url.toString());

    setPairInfos(syncPairSelect.value, false);
}

function urlStateChange() {
    const url = new URL(window.location);
    const urlPairId = url.searchParams.get('pair');

    if (urlPairId !== null) {
        syncPairSelect.value = urlPairId;

        setPairInfos(syncPairSelect.value);

        const monsterId = url.searchParams.get('monsterId');
        const baseId = url.searchParams.get('baseId');
        const formId = url.searchParams.get('formId');

        if (monsterId && baseId && formId) {
            switchTab(monsterId, baseId, formId, false);
        }
    }
    else {
        syncPairSelect.value = landingPairId;
        selectChange();
    }
}

async function init() {
    syncPairSelect = document.getElementById("syncPairSelect");
    syncPairDiv = document.getElementById("syncPairDiv");
    toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await getData();

    document.getElementById("changePairLabel").innerText = jData.locale.syncPairs.change_pair;

    if (isAdminMode) {
        dataArea = document.getElementById("dataArea");

        toolsDiv.style.display = "table";

        let downloadAllBtn = document.getElementById("downloadAll");
        downloadAllBtn.onclick = downloadAll;

        let downloadOneBtn = document.getElementById("downloadOne");
        downloadOneBtn.onclick = downloadData;

        let copyBtn = document.getElementById("copyBtn");
        copyBtn.addEventListener('click', () => navigator.clipboard.writeText(dataArea.value));
    }



    const url = new URL(window.location);
    if (url.searchParams.has('lang')) {
        url.searchParams.delete('lang');
        url.hash = "";
        window.history.pushState(null, '', url.toString());
    }

    populateSelect();
    setLatestPairs();

    syncPairSelect.addEventListener('change', selectChange);

    urlStateChange();
    window.addEventListener('popstate', () => urlStateChange());
}
function getPairStatsRowBipCode(name, statValues, t, scale = 1) {
    const breakPointLevels = [1, 30, 45, 100, 120, 140, 200];

    let string = `\t\t[tr][th]${jData.locale.common[name]}[/th]`;

    let level = 200;
    let pointBIdx = breakPointLevels.findIndex((a) => a >= level);
    let pointAIdx = pointBIdx - 1;

    let buildupParameter = jData.proto.trainerBuildupParameter.filter(tbp => tbp.trainerId === t.trainerId);
    let buildupBonus = 0;

    let numCols = 6 - t.rarity + 1;

    for (let i = 0; i < numCols; i++) {
        let statValue = statValues[pointAIdx] + (level - breakPointLevels[pointAIdx]) * (statValues[pointBIdx] - statValues[pointAIdx]) / (breakPointLevels[pointBIdx] - breakPointLevels[pointAIdx]);

        if (i > 0) {
            let buildupPowerups = jData.proto.trainerBuildupConfig.find(tbc => tbc.trainerBuildupConfigId === buildupParameter[i - 1].trainerBuildupConfigId).nbPowerups || 0;
            buildupBonus += buildupPowerups * buildupParameter[i - 1][name];
            statValue += buildupBonus;
        }

        statValue = Math.trunc(statValue * scale);

        string += `[td]`;

        if (scale > 1) {
            string += `[b][color=green]${statValue}[/color][/b]`;
        }
        else if (scale < 1) {
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

function getMonsterStatsBipCode(m, t, v = null) {
    let string = `\t[item|nostyle][table]\n`
        + `\t\t[tr][th|colspan=${t.rarity + 1}]${(v ? v.monsterName : getMonsterNameByMonsterId(m.monsterId))}[/th][/tr]\n`
        + `\t\t[tr][th]Stats max[/th]`;

    for (let i = t.rarity; i <= 6; i++) {
        string += `[th|width=50px]${i === 6 ? "5+" : i}★[/th]`;
    }

    string += `[/tr]\n`;
    string += getPairStatsRowBipCode("hp", m.hpValues, t);
    string += getPairStatsRowBipCode("atk", m.atkValues, t, (v ? v.atkScale / 100 : 1));
    string += getPairStatsRowBipCode("def", m.defValues, t, (v ? v.defScale / 100 : 1));
    string += getPairStatsRowBipCode("spa", m.spaValues, t, (v ? v.spaScale / 100 : 1));
    string += getPairStatsRowBipCode("spd", m.spdValues, t, (v ? v.spdScale / 100 : 1));
    string += getPairStatsRowBipCode("spe", m.speValues, t, (v ? v.speScale / 100 : 1));

    string += `\t[/table][/item]\n`;

    return string;
}

function getPassiveSkillBipCode(t, v = null) {
    let string = `[center][table]\n`
        + `\t[tr][th|colspan=2]Talents passifs[/th][/tr]\n`
        + `\t[tr][th|width=200px]Nom[/th][th|width=400px]Effet[/th][/tr]\n`;

    for (let i = 1; i <= 5; i++) {
        const passiveId = v && v[`passive${i}Id`] > 0 ? v[`passive${i}Id`] : t[`passive${i}Id`];

        if (passiveId === 0)
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

    for (let i = 1; i < 5; i++) {
        let moveId;

        if (v && v[`move${i}Id`] > -1) {
            moveId = v[`move${i}Id`]
        }
        else if (m && m[`move${i}ChangeId`] > -1) {
            moveId = m[`move${i}ChangeId`];
        }
        else {
            moveId = t[`move${i}Id`];
        }

        if (moveId > -1) {
            let mov = jData.proto.move.find(m => m.moveId == moveId);
            string += `\t[tr]\n`
                + `\t\t[td]${jData.lsd.moveName[moveId].replace("\n", " ")}[/td]\n`
                + `\t\t[td]${mov.type ? `[type=${removeAccents(jData.lsd.motifTypeName[mov.type].toLowerCase())}|MX]` : "–"}[/td]\n`
                + `\t\t[td][type=${removeAccents(categoryToFR[mov.category].toLowerCase())}|MX][/td]\n`
                + `\t\t[td]${mov.power ? `${mov.power}-${Math.trunc(mov.power * 1.2)}` : "–"}[/td]\n`
                + `\t\t[td]${mov.accuracy || "–"}[/td]\n`
                + `\t\t[td]${mov.gaugeDrain ? `[img]/pages/jeuxvideo/pokemon-masters/images/jauge-capa-${mov.gaugeDrain}.png[/img]` : "–"}[/td]\n`
                + `\t\t[td]${jData.lsd.moveTargetType[targetToId[mov.target]] || "–"}[/td]\n`
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

            if (cell) {
                if (cell.version < curr.version) {
                    acc = acc.filter(a => a.cellId !== curr.cellId);
                    acc.push(curr);
                }

                return acc;
            }

            acc = acc.concat(curr);
            return acc;
        }, [])
        .sort((a, b) => a.level - b.level || a.cellId - b.cellId);

    let string = `\t[tr][th|bgcolor=${abilityTypeBGColor[category]}|colspan=5]${jData.locale.syncPairs.sync_grid_ability_type_title[category]}[/th][/tr]\n`;

    for (let p of panels) {
        let amelioration = jData.lsd.abilityName[p.ability.type]
            .replace("[Digit:5digits ]", "+" + p.ability.value)
            .replace("[Name:Ability ]", getPassiveSkillName(p.ability.passiveId))
            .replace("[Name:Move ]", jData.lsd.moveName[p.ability.moveId]).replace("\n", " ");

        string += `\t[tr]\n`
            + `\t\t[td]${amelioration}[/td]\n`
            + `\t\t[td]${p.ability.passiveId ? getPassiveSkillDescr(p.ability.passiveId) : "–"}[/td]\n`
            + `\t\t[td]${p.energyCost || "–"}[/td]\n`
            + `\t\t[td]${p.orbCost} [img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/duo-sphere.png[/img][/td]\n`
            + `\t\t[td][img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/niveau-capacites-${p.level}.png[/img][/td]\n`
            + `\t[/tr]\n`;
    }

    return string;
}

function getPairBipCode(trainerId) {
    let string = `[title]Pokémon Masters EX > ${getPairName(trainerId)}[/title]\n`
        + `[nav]jeuxvideo/pokemon-masters/navigation[/nav]\n`
        + `[h1]Pokémon Masters EX\nDuos Dex\n${getPairName(trainerId)}[/h1]\n`
        + `[include=jeuxvideo/pokemon-masters/duos/0-menu-deroulant]\n`
        + `[include=jeuxvideo/pokemon-masters/duos/menus-deroulants/A_MODIFIER]\n\n`
        + `[include=jeuxvideo/pokemon-masters/duos/0-sommaire-duo]\n\n`;

    let t = jData.proto.trainer.find(t => t.trainerId === trainerId);
    let trainerActorDress = getActorDressFromTrainerId(trainerId);
    let pairEvolutions = jData.proto.monsterEvolution.filter(me => me.trainerId === trainerId);
    let monsterIds = [];
    let monsters = [];
    let pairVariations = {};
    monsterIds.push(t.monsterId);
    pairEvolutions.forEach(pe => monsterIds.push(pe.monsterIdNext));

    for (let i = 0; i < monsterIds.length; i++) {
        pairVariations[monsterIds[i]] = null;
        let variations = jData.proto.monsterVariation.filter(mv => mv.monsterId === monsterIds[i] && mv.form !== 4);

        let enhancements = jData.proto.monsterEnhancement.filter(me => me.monsterIdCurrent === monsterIds[i] && me.type !== "2");

        if (enhancements.length > 0) {
            enhancements.forEach(e => {
                variations.push(...jData.proto.monsterVariation.filter(mv => mv.monsterId === e.monsterIdNext));
            });
        }

        if (variations.length > 0) {
            pairVariations[monsterIds[i]] = variations.map(v => {
                v.monsterBaseId = getMonsterBaseIdFromActorId(v.actorId);
                v.monsterName = getNameByMonsterBaseId(v.monsterBaseId, v.formId);
                return v;
            });
        }

        monsters.push(jData.proto.monster.find(m => m.monsterId === monsterIds[i]));
    }

    string += `[center][table]\n`
        + `\t[tr][th|width=430px|colspan=4]${getTrainerName(trainerId).replace("\n", "")}[/th][th|colspan=2|width=230px]`;

    for (let i = 0; i < monsters.length; i++) {
        if (i > 0)
            string += ", ";

        string += getMonsterNameByMonsterId(monsters[i].monsterId);

        if (pairVariations[monsterIds[i]])
            pairVariations[monsterIds[i]].forEach(v => {
                string += `, ${v.monsterName}`
            });
    }

    string += "[/th][/tr]\n"
        + "\t[tr]\n";

    string += `\t[td${(hasExUnlocked(trainerId) && trainerActorDress) ? "|rowspan=3" : ""}|colspan=4][img]/pages/jeuxvideo/pokemon-masters/images/personnages/A_MODIFIER.png[/img][/td]\n`
        + `\t[td|colspan=2]`;

    for (let i = 0; i < monsters.length; i++) {
        string += `[pokeimg=${getPokemonNumberFromMonsterBaseId(monsters[i].monsterBaseId)}|MX]`;

        if (pairVariations[monsterIds[i]])
            for (const v of pairVariations[monsterIds[i]]) {
                string += `[pokeimg=${getPokemonNumberFromMonsterBaseId(monsters[i].monsterBaseId)}A_MODIFIER|MX]`;
            }
    }

    string += `[/td]\n\t[/tr]\n`;

    if (hasExUnlocked(trainerId) && trainerActorDress) {
        string += `\t[tr][th|colspan=2]Tenue 6★ EX[/th][/tr]\n`
            + `\t[tr][td|colspan=2][img|w=230]/pages/jeuxvideo/pokemon-masters/images/personnages/A_MODIFIER-ex.png[/img][/td][/tr]\n`;
    }

    string += `\t[tr][th]Rôle[/th][th]Potentiel (Base)[/th][th]Type[/th][th]Faiblesse[/th][th]Origine[/th][th]Tenue[/th][/tr]\n`
        + `\t[tr]\n`
        + `\t[td|width=100px][img]/pages/jeuxvideo/pokemon-masters/images/roles/${getRoleUrlByTrainerId(trainerId)}.png[/img][br]${getRoleByTrainerId(trainerId)}[/td]\n`
        + `\t[td|width=100px]${"★".repeat(getTrainerRarity(trainerId))}[/td]\n`
        + `\t[td|width=100px][type=${removeAccents(jData.lsd.motifTypeName[t.type].toLowerCase())}|MX][/td]\n`
        + `\t[td|width=100px][type=${removeAccents(jData.lsd.motifTypeName[t.weakness].toLowerCase())}|MX][/td]\n`
        + `\t[td|width=200px]Pokémon A_MODIFIER[/td]\n`
        + `\t[td|width=200px]Pokémon A_MODIFIER[/td]\n`
        + `\t[/tr]\n`
        + `\t[tr][th|colspan=6]Descriptions[/th][/tr]\n`;

    if (jData.lsd.trainerDescription[trainerId])
        string += `\t[tr][td|colspan=6]${agenderDescription(jData.lsd.trainerDescription[trainerId].replaceAll("\n", " "))}[/td][/tr]\n`;

    monsters.map(m => m.monsterBaseId).forEach(mbId => {
        if (jData.lsd.monsterDescription[mbId])
            string += `\t[tr][td|colspan=6]${jData.lsd.monsterDescription[mbId].replaceAll("\n", " ")}[/td][/tr]\n`;
    }
    );

    string += "[/table][/center]\n\n";

    string += `[ancre=analyse][h2]Analyse du Duo[/h2]\n`
        + `[i]Aucune pour le moment ![/i]\n\n`;

    string += `[ancre=stats][h2]Statistiques[/h2]\n`
        + `[listh]\n`;

    for (const m of monsters) {
        string += getMonsterStatsBipCode(m, t);

        if (pairVariations[m.monsterId])
            for (const v of pairVariations[m.monsterId]) {
                string += getMonsterStatsBipCode(m, t, v);
            }
    }

    if (hasExRoleUnlocked(trainerId)) {
        string += `\t[include=jeuxvideo/pokemon-masters/duos/include/role-ex-${getExRoleUrlByTrainerId(trainerId)}]\n`;
    }

    string += `[/listh]\n\n`;

    string += `[ancre=talents][h2]Talents[/h2]\n`;

    string += `[h3]${getMonsterNameByMonsterId(monsterIds[monsterIds.length - 1])}[/h3]\n`;
    string += getPassiveSkillBipCode(t);

    monsterIds.forEach(mId => {
        if (pairVariations[mId]) {
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

    for (let i = 1; i <= 5; i++) {
        let ts = jData.proto.teamSkill.find(tsk => tsk.teamSkillId == t[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 1);
        let descr = []
        descr.push(jData.proto.teamSkill.find(tsk => tsk.teamSkillId == t[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 3));
        descr.push(jData.proto.teamSkill.find(tsk => tsk.teamSkillId == t[`teamSkill${i}Id`] && tsk.teamSkillPropNum === 4));

        if (!ts)
            continue;

        string += `\t[tr][td]${jData.lsd.teamSkillTag[ts.teamSkillPropValue]}[/td][td]`;

        let include = `[include=/jeuxvideo/pokemon-masters/duos/talents/mots-cles-${getRoleUrlByTrainerId(trainerId, false)}]`;
        if (i === 1) {
            include = `[include=/jeuxvideo/pokemon-masters/duos/talents/type-${getRoleUrlByTrainerId(trainerId, false)}]`;
        }

        const digitBlock = "[Digit:3digits ]";

        for (let i = 0; i < descr.length; i++) {
            if (descr[i]) {
                let d = jData.lsd.teamSkillEffect[descr[i].teamSkillPropValue].replace("\n", " ");
                let index = d.indexOf(digitBlock);
                d = d.replace(digitBlock, "X");

                if (i > 0)
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
        if (pairVariations[m.monsterId]) {
            pairVariations[m.monsterId].forEach(v => {
                string += `\n[h3]${v.monsterName}[/h3]\n`;
                string += getMoveBipCode(t, m, v);
            });
        }
    });

    let gmaxVar = jData.proto.monsterVariation.find(mv => mv.monsterId === monsterIds[monsterIds.length - 1] && mv.form === 4);

    if (gmaxVar) {

        string += `\n[center][table]\n`
            + `\t[tr][th|colspan=6|width=1000px][img|w=32]/pages/jeuxvideo/pokemon-masters/images/icones-combat/capacite-duo-dynamax.png[/img] Capacités Duo Dynamax[/th][/tr]\n`
            + `\t[tr][th|width=100px]Nom[/th][th|width=80px]Type[/th][th|width=80px]Catég.[/th][th|width=50px]Puis.[/th][th|width=80px]Cible[/th][th]Effet[/th][/tr]\n`;

        for (let i = 1; i < 5; i++) {
            let moveId = gmaxVar[`moveDynamax${i}Id`];

            if (moveId > -1) {
                let mov = jData.proto.move.find(m => m.moveId == moveId);
                string += `\t[tr]\n`
                    + `\t\t[td]${jData.lsd.moveName[moveId].replace("\n", " ")}[/td]\n`
                    + `\t\t[td]${mov.type ? `[type=${removeAccents(jData.lsd.motifTypeName[mov.type].toLowerCase())}|MX]` : "–"}[/td]\n`
                    + `\t\t[td][type=${removeAccents(categoryToFR[mov.category].toLowerCase())}|MX][/td]\n`
                    + `\t\t[td]${mov.power ? `${mov.power}-${Math.trunc(mov.power * 1.2)}` : "–"}[/td]\n`
                    + `\t\t[td]${jData.lsd.moveTargetType[targetToId[mov.target]] || "–"}[/td]\n`
                    + `\t\t[td]${getMoveDescr(moveId)}[/td]\n`
                    + `\t[/tr]\n`
            }
        }

        string += `[/table][/center]\n`;
    }

    let syncMove = jData.proto.move.find(mov => mov.moveId === monsters[monsters.length - 1].syncMoveId);

    string += "\n[center][table]\n"
        + `\t[tr][th|colspan=${6 + hasExUnlocked(trainerId) + hasExRoleUnlocked(trainerId)}|width=1000px][img|w=32]/pages/jeuxvideo/pokemon-masters/images/icones-combat/capacite-duo.png[/img] Capacité Duo[/th][/tr]\n`
        + `\t[tr][th|width=100px]Nom[/th][th|width=80px]Type[/th][th|width=80px]Catég.[/th][th|width=50px]Puis.[/th][th|width=200px]Effet[/th]`;

    if (hasExUnlocked(trainerId)) {
        string += `[th|width=150px]Effet (EX)[/th]`;
    }
    if (hasExRoleUnlocked(trainerId)) {
        string += `[th|width=150px]Rôle EX[/th]`;
    }

    string += `[/tr]\n`
        + `\t[tr]\n`
        + `\t\t[td]${jData.lsd.moveName[syncMove.moveId]}[/td]\n`
        + `\t\t[td]${syncMove.type ? `[type=${removeAccents(jData.lsd.motifTypeName[syncMove.type].toLowerCase())}|MX]` : "–"}[/td]\n`
        + `\t\t[td][type=${removeAccents(categoryToFR[syncMove.category].toLowerCase())}|MX][/td]\n`
        + `\t\t[td]${syncMove.power ? `${syncMove.power}-${Math.trunc(syncMove.power * 1.2)}` : "–"}[/td]\n`
        + `\t\t[td]${getMoveDescr(syncMove.moveId)}[/td]\n`;

    if (hasExUnlocked(trainerId)) {
        string += `\t\t[td]${exSyncEffect[t.role]}[/td]\n`;
    }
    if (hasExRoleUnlocked(trainerId)) {
        string += `\t\t[td]${exSyncEffect[getExRoleId(trainerId)]}[/td]\n`;
    }

    string += `\t[/tr]\n`
        + `[/table][/center]\n\n`;

    string += `[ancre=plateau][h2]Plateau Duo-Gemme[/h2]\n`
        + `[center][table]\n`
        + `\t[tr][th|width=250px]Amélioration[/th][th|width=300px]Effet[/th][th|width=100px]Énergie requise[/th][th|width=100px]Duo-Sphères requises[/th][th|width=100px]Niveau des Capacités requis[/th][/tr]\n`;

    let ap = jData.proto.abilityPanel.filter(ap => ap.trainerId === trainerId)
        .map(ap => {
            ap.ability = jData.proto.ability.find(a => a.abilityId === ap.abilityId);
            ap.level = 1;
            ap.conditionIds.forEach(cid => {
                let releaseCon = jData.proto.abilityReleaseCondition.find(arc => arc.conditionId === cid);

                switch (releaseCon.type) {
                    case 6:
                    case 7:
                        ap.level = releaseCon.parameter;
                }
            });
            ap.type = getAbilityType(ap.ability);
            return ap;
        });

    for (const key of Object.keys(abilityType)) {
        string += appendGridCategoryBipCode(ap, abilityType[key]);
    }

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
    let trainerIds = jData.proto.trainer.filter(t => t.scheduleId !== "NEVER_CHECK_DICTIONARY" && t.scheduleId !== "NEVER")
        .map(t => t.trainerId);

    for (const tid of trainerIds) {
        let filename = removeAccents(getPairName(tid)).replace("/", "-") + '.txt';
        zip.file(filename, getPairBipCode(tid));
    }

    zip.generateAsync({ type: 'blob' })
        .then(function (content) {
            saveAs(content, "Duos.zip");
        });
}

init().then();
