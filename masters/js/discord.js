let discordMsgTxt;

let discordLocale;

let abilityPanel;
let schedule;

let monsterBase;
let monster;
let monsterNames;

let trainerBase;
let trainerExRole;
let trainer;
let trainerNames;
let trainerVerboseNames;

let versions;

async function getData() {
    await buildHeader();
    const [
        abilityPanelResponse,
        monsterResponse,
        monsterBaseResponse,
        scheduleResponse,
        trainerResponse,
        trainerExRoleResponse,
        trainerBaseResponse,
        discordResponse,
        versionResponse,
        monsterNameResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,

    ] = await Promise.all([
        fetch("./data/proto/AbilityPanel.json"),
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/Schedule.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerExRole.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch(`./data/locales/${lng}/discord.json`),
        fetch(`./data/custom/version_release_dates.json`),
        fetch(`./data/lsd/monster_name_${lng}.json`),
        fetch(`./data/lsd/trainer_name_${lng}.json`),
        fetch(`./data/lsd/trainer_verbose_name_${lng}.json`)
    ])
        .catch(error => console.log(error));

    discordLocale = await discordResponse.json();

    abilityPanel = await abilityPanelResponse.json();
    abilityPanel = abilityPanel.entries;

    const monstersJSON = await monsterResponse.json();
    monster = monstersJSON.entries;

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = monstersBaseJSON.entries;

    versions = await versionResponse.json().then(orderByVersion);

    schedule = await scheduleResponse.json();
    schedule = schedule.entries.filter(s => s.scheduleId.startsWith("chara_") && s.startDate >= versions[0].releaseTimestamp);

    const trainersJSON = await trainerResponse.json();
    trainer = trainersJSON.entries;

    const trainersBaseJSON = await trainerBaseResponse.json();
    trainerBase = trainersBaseJSON.entries;

    const trainerExRoleJSON = await trainerExRoleResponse.json();
    trainerExRole = trainerExRoleJSON.entries.sort((a, b) => b.scheduleId.localeCompare(a.scheduleId));

    monsterNames = await monsterNameResponse.json();
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();
}

function appendNewPairs() {
    discordMsgTxt.value += `\n## ${discordLocale.new_pairs_information_title}`;

    let newTrainers = trainer
        .filter(t => schedule.map(s => s.scheduleId).includes(t.scheduleId))
        .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));

    newTrainers.forEach(tr => {
        discordMsgTxt.value += `\n- **[${getPairName(tr.trainerId)}](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${tr.trainerId})**`;
    });
}

function appendSyncGridUps() {
    discordMsgTxt.value += `\n## ${discordLocale.sync_grid_ups_title}`;
    discordMsgTxt.value += `\n*${discordLocale.sync_grid_ups_text}*`;

    let updatedGridTrainer = [...new Set(abilityPanel.filter(ap => schedule.map(s => s.scheduleId).includes(ap.scheduleId)).map(ap => ap.trainerId))]

    updatedGridTrainer = updatedGridTrainer.map(tid => {
        let trainerPanels = abilityPanel.filter(ap => ap.trainerId === tid);
        return {"trainerId" : tid, "new" : trainerPanels.length, "old" : trainerPanels.filter(tp => !schedule.map(s => s.scheduleId).includes(tp.scheduleId)).length };
    });

    updatedGridTrainer.forEach(ugt => {
        discordMsgTxt.value += `\n- **[${getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${ugt.trainerId})**`;
    });
}

function appendNewExRoles() {
    discordMsgTxt.value += `\n## ${discordLocale.new_ex_roles_title}`;

    let newExRoles = trainerExRole.filter(ter => schedule.map(s => s.scheduleId).includes(ter.scheduleId)).sort((a, b) => {
        let aSched = schedule.find(s => s.scheduleId === a.scheduleId);
        let bSched = schedule.find(s => s.scheduleId === b.scheduleId);

        return aSched.startDate - bSched.startDate;
    });

    for(let entry in newExRoles) {
        let role = commonLocales.role_names[newExRoles[entry].role];

        discordMsgTxt.value += `\n- **${getPairName(newExRoles[entry].trainerId)} :** ${role}`;
    }
}

getData().then(() => {
    document.getElementById("pageTitle").innerText = discordLocale.title;

    discordMsgTxt = document.getElementById("discordMsg");
    discordMsgTxt.value = `## [${discordLocale.monthly_schedule}](${window.location.protocol}//${window.location.hostname}/masters/programme.html)`;

    appendNewPairs();
    appendSyncGridUps();
    appendNewExRoles();

    discordMsgTxt.innerHTML += "<ul>";
    for(let entry in trainerExRole) {
        let role = commonLocales.role_names[trainerExRole[entry].role];

        discordMsgTxt.innerHTML += `<li><b>${getTrainerName(trainerExRole[entry].trainerId)} & ${getMonsterNameByTrainerId(trainerExRole[entry].trainerId)} :</b> ${role}</li>`;
    }
    discordMsgTxt.innerHTML += "</ul>";
});
