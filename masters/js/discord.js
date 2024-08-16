let discordMsgTxt;
let firstMsgTxt;

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
let motifTypeName;

let versions;

async function getData() {
    await buildHeader();

    discordLocale = await jsonCache.getLocale("discord");

    abilityPanel = await jsonCache.getProto("AbilityPanel");

    monster = await jsonCache.getProto("Monster");
    monsterBase = await jsonCache.getProto("MonsterBase");

    versions = await jsonCache.getCustom("version_release_dates").then(orderByVersion);

    schedule = (await jsonCache.getProto("Schedule"))
        .filter(s => s.scheduleId.startsWith("chara_") && s.startDate >= versions[0].releaseTimestamp);

    trainer = await jsonCache.getProto("Trainer");
    trainerBase = await jsonCache.getProto("TrainerBase");
    trainerExRole = (await jsonCache.getProto("TrainerExRole")).sort((a, b) => b.scheduleId.localeCompare(a.scheduleId));

    monsterNames = await jsonCache.getLsd("monster_name");
    motifTypeName = await jsonCache.getLsd("motif_type_name");
    trainerNames = await jsonCache.getLsd("trainer_name");
    trainerVerboseNames = await jsonCache.getLsd("trainer_verbose_name");
}

async function appendNewPairs(txtArea, isLink = false) {
    if(isLink) {
        txtArea.value += `## ${discordLocale.new_pairs_information_title}`;
    }
    else {
        txtArea.value += `### ${discordLocale.new_sync_pairs}`
    }

    let newTrainers = trainer
        .filter(t => schedule.map(s => s.scheduleId).includes(t.scheduleId))
        .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));

    for(const tr of newTrainers) {
        if(isLink) {
            txtArea.value += `\n- **[${await getPairName(tr.trainerId)}](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${tr.trainerId})**`;
        }
        else {
            txtArea.value += `\n- **${await getPairName(tr.trainerId)}** (${await getTrainerTypeName(tr.trainerId)}): ${await getRoleByTrainerId(tr.trainerId)}`;
        }
    }
}

async function appendSyncGridUps(txtArea, isLink = false) {
    if (isLink) {
        txtArea.value += `\n## ${discordLocale.sync_grid_ups_title}`;
        txtArea.value += `\n*${discordLocale.sync_grid_ups_text}*`;
    } else {
        txtArea.value += `\n### ${discordLocale.sync_grid_ups_title_small}`
    }

    let updatedGridTrainer = [...new Set(abilityPanel.filter(ap => schedule.map(s => s.scheduleId).includes(ap.scheduleId)).map(ap => ap.trainerId))]

    updatedGridTrainer = updatedGridTrainer.map(tid => {
        let trainerPanels = abilityPanel.filter(ap => ap.trainerId === tid);
        return {
            "trainerId": tid,
            "new": trainerPanels.length,
            "old": trainerPanels.filter(tp => !schedule.map(s => s.scheduleId).includes(tp.scheduleId)).length
        };
    });

    for (const ugt of updatedGridTrainer) {
        if (isLink)
            txtArea.value += `\n- **[${await getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${ugt.trainerId})**`;
        else
            txtArea.value += `\n- **${await getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})**`;
    }
}

async function appendNewExRoles(txtArea, isLink = false) {
    if(isLink)
        txtArea.value += `\n## ${discordLocale.new_ex_roles_title}`;
    else
        txtArea.value += `\n### ${discordLocale.new_ex_roles_title_small}`

    let newExRoles = trainerExRole.filter(ter => schedule.map(s => s.scheduleId).includes(ter.scheduleId)).sort((a, b) => {
        let aSched = schedule.find(s => s.scheduleId === a.scheduleId);
        let bSched = schedule.find(s => s.scheduleId === b.scheduleId);

        return aSched.startDate - bSched.startDate;
    });

    for(const entry of newExRoles) {
        let role = commonLocales.role_names[entry.role];

        if(isLink)
            txtArea.value += `\n- **[${await getPairName(entry.trainerId)}](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${entry.trainerId}) :** ${role}`;
        else
            txtArea.value += `\n- **${await getPairName(entry.trainerId)} :** ${role}`;
    }
}

getData().then(async () => {
    document.getElementById("pageTitle").innerText = discordLocale.title;

    firstMsgTxt = document.getElementById("firstMsg")

    await appendNewPairs(firstMsgTxt);
    await appendNewExRoles(firstMsgTxt);
    await appendSyncGridUps(firstMsgTxt);

    discordMsgTxt = document.getElementById("discordMsg");
    discordMsgTxt.value = `## [${discordLocale.monthly_schedule}](${window.location.protocol}//${window.location.hostname}/masters/programme.html)\n`;

    await appendNewPairs(discordMsgTxt, true);
    await appendSyncGridUps(discordMsgTxt, true);
    await appendNewExRoles(discordMsgTxt, true);
});
