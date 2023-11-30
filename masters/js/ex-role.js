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
        fetch("./data/lsd/monster_name_fr.json"),
        fetch("./data/lsd/trainer_name_fr.json"),
        fetch("./data/lsd/trainer_verbose_name_fr.json")
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
    exRoleDiv = document.getElementById("exRoleDiv");

    exRoleDiv.innerHTML += "<ul>";
    for(let entry in trainerExRole) {
        let role = role_names[trainerExRole[entry].role];

        exRoleDiv.innerHTML += `<li><b>${getTrainerName(trainerExRole[entry].trainerId)} & ${getMonsterNameByTrainerId(trainerExRole[entry].trainerId)} :</b> ${role}</li>`;
    }
    exRoleDiv.innerHTML += "</ul>";
});
