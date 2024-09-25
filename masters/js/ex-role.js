let exRoleDiv;

let monsterBase;
let monster;
let monsterNames;

let trainerBase;
let trainerExRole;
let trainer;
let trainerNames;
let trainerVerboseNames;

async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("TrainerExRole");

    preloadUtils();

    await jsonCache.runPreload();

    jData.proto.trainerExRole.sort((a, b) => b.scheduleId.localeCompare(a.scheduleId));
}

getData().then(() => {
    document.getElementById("pageTitle").innerText = jData.locale.common.submenu_pair_ex_role;

    exRoleDiv = document.getElementById("exRoleDiv");

    exRoleDiv.innerHTML += "<ul>";
    for(let entry in jData.proto.trainerExRole) {
        let role = jData.locale.common.role_names[jData.proto.trainerExRole[entry].role];

        exRoleDiv.innerHTML += `<li><b>${getTrainerName(jData.proto.trainerExRole[entry].trainerId)} & ${getMonsterNameByTrainerId(jData.proto.trainerExRole[entry].trainerId)} :</b> ${role}</li>`;
    }
    exRoleDiv.innerHTML += "</ul>";
});
