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

    monster = await jsonCache.getProto("Monster");
    monsterBase = await jsonCache.getProto("MonsterBase");

    trainer = await jsonCache.getProto("Trainer");
    trainerBase = await jsonCache.getProto("TrainerBase");
    trainerExRole = (await jsonCache.getProto("TrainerExRole"))
        .sort((a, b) => b.scheduleId.localeCompare(a.scheduleId));

    monsterNames = await jsonCache.getLsd("monster_name");
    trainerNames = await jsonCache.getLsd("trainer_name");
    trainerVerboseNames = await jsonCache.getLsd("trainer_verbose_name");
}

getData().then(async () => {
    document.getElementById("pageTitle").innerText = commonLocales.submenu_pair_ex_role;

    exRoleDiv = document.getElementById("exRoleDiv");

    exRoleDiv.innerHTML += "<ul>";
    for(let entry in trainerExRole) {
        let role = commonLocales.role_names[trainerExRole[entry].role];

        exRoleDiv.innerHTML += `<li><b>${await getTrainerName(trainerExRole[entry].trainerId)} & ${await getMonsterNameByTrainerId(trainerExRole[entry].trainerId)} :</b> ${role}</li>`;
    }
    exRoleDiv.innerHTML += "</ul>";
});
