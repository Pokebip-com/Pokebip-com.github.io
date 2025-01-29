let discordMsgTxt;
let firstMsgTxt;

const gymStartScheduleId = "7010_1W_Gym_start";

async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("AbilityPanel");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("Trainer");
    jsonCache.preloadProto("TrainerExRole");

    // CUSTOM
    jsonCache.preloadCustom("version_release_dates");

    // Locale
    jsonCache.preloadLocale("discord");

    // Preload utils
    preloadUtils();

    await jsonCache.runPreload();

    orderByVersion(jData.custom.versionReleaseDates);

    jData.proto.schedule = jData.proto.schedule
        .filter(s => s.startDate >= jData.custom.versionReleaseDates[0].releaseTimestamp && (s.scheduleId.startsWith("chara_") || s.scheduleId === gymStartScheduleId));

    jData.proto.trainerExRole.sort((a, b) => b.scheduleId.localeCompare(a.scheduleId));

}

function appendNewPairs(txtArea, isLink = false) {
    if(isLink) {
        txtArea.value += `## ${jData.locale.discord.new_pairs_information_title}`;
    }
    else {
        txtArea.value += `### ${jData.locale.discord.new_sync_pairs}`
    }

    let newTrainers = jData.proto.trainer
        .map(t => {
            // Scout Method 4 === Gym, ScheduleId at FOREVER === Release of the update
            if(t.scoutMethod === 4 && t.scheduleId === "FOREVER") {
                t.scheduleId = gymStartScheduleId;
            }

            return t;
        })
        .filter(t => jData.proto.schedule.map(s => s.scheduleId).includes(t.scheduleId))
        .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));

    for(const tr of newTrainers) {
        if(isLink) {
            txtArea.value += `\n- **[${getPairName(tr.trainerId)}](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${tr.trainerId})**`;
        }
        else {
            txtArea.value += `\n- **${getPairName(tr.trainerId)}** (${getTrainerTypeName(tr.trainerId)}): ${getRoleByTrainerId(tr.trainerId)}${hasExRoleUnlocked(tr.trainerId) ? "/" + jData.locale.common.role_names[getExRoleId(tr.trainerId)] : ""}`;
        }
    }
}

function appendSyncGridUps(txtArea, isLink = false) {
    if (isLink) {
        txtArea.value += `\n## ${jData.locale.discord.sync_grid_ups_title}`;
        txtArea.value += `\n*${jData.locale.discord.sync_grid_ups_text}*`;
    } else {
        txtArea.value += `\n### ${jData.locale.discord.sync_grid_ups_title_small}`
    }

    let updatedGridTrainer = [...new Set(jData.proto.abilityPanel.filter(ap => jData.proto.schedule.map(s => s.scheduleId).includes(ap.scheduleId)).map(ap => ap.trainerId))]

    updatedGridTrainer = updatedGridTrainer.map(tid => {
        let trainerPanels = jData.proto.abilityPanel.filter(ap => ap.trainerId === tid);
        return {
            "trainerId": tid,
            "new": trainerPanels.length,
            "old": trainerPanels.filter(tp => !jData.proto.schedule.map(s => s.scheduleId).includes(tp.scheduleId)).length
        };
    });

    for (const ugt of updatedGridTrainer) {
        if (isLink)
            txtArea.value += `\n- **[${getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${ugt.trainerId})**`;
        else
            txtArea.value += `\n- **${getPairName(ugt.trainerId)} (${ugt.old} → ${ugt.new})**`;
    }
}

function appendNewExRoles(txtArea, isLink = false) {
    if(isLink)
        txtArea.value += `\n## ${jData.locale.discord.new_ex_roles_title}`;
    else
        txtArea.value += `\n### ${jData.locale.discord.new_ex_roles_title_small}`

    let newExRoles = jData.proto.trainerExRole.filter(ter => jData.proto.schedule.map(s => s.scheduleId).includes(ter.scheduleId)).sort((a, b) => {
        let aSched = jData.proto.schedule.find(s => s.scheduleId === a.scheduleId);
        let bSched = jData.proto.schedule.find(s => s.scheduleId === b.scheduleId);

        return aSched.startDate - bSched.startDate;
    });

    for(const entry of newExRoles) {
        let role = jData.locale.common.role_names[entry.role];

        if(isLink)
            txtArea.value += `\n- **[${getPairName(entry.trainerId)}](${window.location.protocol}//${window.location.hostname}/masters/duo.html?pair=${entry.trainerId}) :** ${role}`;
        else
            txtArea.value += `\n- **${getPairName(entry.trainerId)} :** ${role}`;
    }
}

getData().then(async () => {
    document.getElementById("pageTitle").innerText = jData.locale.discord.title;

    firstMsgTxt = document.getElementById("firstMsg")

    appendNewPairs(firstMsgTxt);
    appendNewExRoles(firstMsgTxt);
    appendSyncGridUps(firstMsgTxt);

    discordMsgTxt = document.getElementById("discordMsg");
    discordMsgTxt.value = `## [${jData.locale.discord.monthly_schedule}](${window.location.protocol}//${window.location.hostname}/masters/programme.html)\n`;

    appendNewPairs(discordMsgTxt, true);
    appendSyncGridUps(discordMsgTxt, true);
    appendNewExRoles(discordMsgTxt, true);
});
