let exRoleDiv;

let monsterBase;
let monsterInfos;
let monsterNames;

let trainerBase;
let trainerExRole;
let trainerInfos;
let trainerNames;
let trainerVerboseNames;

const role_names = ["Attaquant (Physique)", "Attaquant (Spécial)", "Soutien", "Tacticien", "Accélérateur", "Régisseur"];

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
    monsterInfos = getBySpecificID(monstersJSON.entries, "monsterId");

    const monstersBaseJSON = await monsterBaseResponse.json();
    monsterBase = getBySpecificID(monstersBaseJSON.entries, "monsterBaseId");

    const trainersJSON = await trainerResponse.json();
    trainerInfos = getBySpecificID(trainersJSON.entries, "trainerId");

    const trainersBaseJSON = await trainerBaseResponse.json();
    trainerBase = getBySpecificID(trainersBaseJSON.entries, "id");

    const trainerExRoleJSON = await trainerExRoleResponse.json();
    trainerExRole = trainerExRoleJSON.entries.sort((a, b) => b.scheduleId.localeCompare(a.scheduleId));

    monsterNames = await monsterNameResponse.json();
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();
}

function getBySpecificID(data, id) {
    return data.reduce(function (r, a) {
        r[a[id]] = r[a[id]] || [];
        r[a[id]].push(a);
        return r;
    }, {});
}

function getTrainerName(id) {
    return trainerVerboseNames[id] || trainerNames[trainerBase[trainerInfos[id][0].trainerBaseId][0].trainerNameId] || "Dresseur (Scottie/Bettie)";
}

function getMonsterNameByTrainerId(id) {
    return monsterNames[monsterBase[monsterInfos[trainerInfos[id][0].monsterId][0].monsterBaseId][0].monsterNameId];
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
