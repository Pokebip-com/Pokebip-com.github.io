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
    const [
        monsterResponse,
        monsterBaseResponse,
        trainerResponse,
        trainerExRoleResponse,
        trainerBaseResponse,
        monsterNameResponse,
        trainerNameResponse,
        trainerVerboseNameResponse,

    ] = await Promise.all([
        fetch("./data/proto/Monster.json"),
        fetch("./data/proto/MonsterBase.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerExRole.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch(`./data/lsd/monster_name_${lng}.json`),
        fetch(`./data/lsd/trainer_name_${lng}.json`),
        fetch(`./data/lsd/trainer_verbose_name_${lng}.json`)
    ])
        .catch(error => console.log(error));

    const monstersJSON = await monsterResponse.json();
    monster = monstersJSON.entries;

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = monstersBaseJSON.entries;

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

getData().then(() => {
    document.getElementById("pageTitle").innerText = commonLocales.submenu_pair_ex_role;

    exRoleDiv = document.getElementById("exRoleDiv");

    exRoleDiv.innerHTML += "<ul>";
    for(let entry in trainerExRole) {
        let role = commonLocales.role_names[trainerExRole[entry].role];

        exRoleDiv.innerHTML += `<li><b>${getTrainerName(trainerExRole[entry].trainerId)} & ${getMonsterNameByTrainerId(trainerExRole[entry].trainerId)} :</b> ${role}</li>`;
    }
    exRoleDiv.innerHTML += "</ul>";
});
