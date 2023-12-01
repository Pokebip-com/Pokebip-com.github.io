
const starsHex = ["#FFFFFF", "#bed9db", "#cfb19e", "#cbdbe3", "#ebe59a"];
const role_names = ["Attaquant (Physique)", "Attaquant (Spécial)", "Soutien", "Tacticien", "Accélérateur", "Régisseur"];
const targetToId = {
    "AllySingle" : 0,
    "AllyAll" : 1,
    "OpponentSingle" : 2,
    "OpponentAll" : 3,
    "Self" : 4,
    "AllyField" : 7,
    "OpponentField" : 8,
    "EntireField" : 9,
};
const categoryToFR = {
    "Physical" : "Physique",
    "Special" : "Spéciale",
    "Status" : "Statut",
};
const exSyncEffect = [
    "Cible tous les ennemis.",
    "Cible tous les ennemis.",
    "Augmente la détermination de deux rangs la première fois qu'une capacité Duo est utilisée.",
    "La puissance des capacités Duo est augmentée de 50 %.",
    "La première fois que le lanceur utilise une capacité Duo, le nombre d'actions nécessaires pour lancer une capacité Duo est réduit de trois.",
    "Implémente un effet de terrain juste avant la première utilisation de la capacité Duo, et rallonge la durée de l'effet.",
];


function getPairPrettyPrint(trainerId) {
    return `${getStarsRarityString(trainerId)} ${getPairName(trainerId)}`;
}

function getPairName(trainerId) {
    return `${getTrainerName(trainerId)} & ${getMonsterNameByTrainerId(trainerId)}`;
}

function getStarsRarityString(trainerId) {
    return `<span style="color: ${starsHex[getTrainerRarity(trainerId)-1]}; -webkit-text-stroke: thin black;"><b>${"★".repeat(getTrainerRarity(trainerId))}</b></span>`;
}

function getTrainerName(id) {
    let tr = trainer.find(t => t.trainerId === id) || {};
    let tb = trainerBase.find(tba => tba.id === tr.trainerBaseId.toString()) || {};
    return trainerVerboseNames[id] || trainerNames[tb.trainerNameId] || "Dresseur (Scottie/Bettie)";
}

function getMonsterNameByTrainerId(id) {
    let tr = trainer.find(t => t.trainerId === id) || {};
    let mon = monster.find(m => m.monsterId.toString() === tr.monsterId.toString()) || {};
    let mb = monsterBase.find(mb => mb.monsterBaseId === mon.monsterBaseId) || {};
    return monsterNames[mb.monsterNameId] || "";
}

function getMonsterNameByMonsterId(id) {
    let mon = monster.find(m => m.monsterId.toString() === id.toString()) || {};
    return getNameByMonsterBaseId(mon.monsterBaseId);
}

function getNameByMonsterBaseId(id, formId = 0) {
    let mb = monsterBase.find(mb => mb.monsterBaseId === id) || {};
    let name = monsterNames[mb.monsterNameId] || "";

    if(formId > 0 && monsterForms[formId]) {
        name += ` ${monsterForms[formId]}`;
    }

    else if(mb.formId && mb.formId > 0 && monsterForms[mb.formId]) {
        name += ` ${monsterForms[mb.formId]}`;
    }
    return name;

}

function getTrainerActorId(trainerId) {
    let trainerBaseId = trainer.find(t => t.trainerId === trainerId).trainerBaseId;

    return trainerBase.find(tb => tb.id === trainerBaseId.toString()).actorId;
}

function getFormIdFromActorId(actorId) {
    return monsterBase.find(mb => mb.actorId === actorId).formId || -1;
}

function getMonsterBaseIdFromMonsterId(monsterId) {
    return monster.find(m => m.monsterId === monsterId).monsterBaseId;
}

function getMonsterBaseIdFromActorId(actorId) {
    return monsterBase.find(mb => mb.actorId === actorId).monsterBaseId || -1;
}

function getMonsterActorIdFromBaseId(baseId) {
    return monsterBase.find(mb => mb.monsterBaseId === baseId).actorId;
}

function getMonsterById(monsterId) {
    return monster.find(m => m.monsterId === monsterId);
}

function getRoleByTrainerId(id) {
    const role = trainer.find(t => t.trainerId === id).role;

    switch(role) {
        case 0:
            return "Attaquant Physique";

        case 1:
            return "Attaquant Spécial";

        default:
            return role_names[role];
    }

}

function getTrainerTypeName(id) {
    return motifTypeName[trainer.find(t => t.trainerId === id).type];
}

function getTrainerWeaknessName(id) {
    return motifTypeName[trainer.find(t => t.trainerId === id).weakness];
}

function getTrainerRarity(id) {
    return trainer.find(t => t.trainerId === id).rarity;
}

function hasExUnlocked(id) {
    return trainer.find(t => t.trainerId === id).exScheduleId !== "NEVER";
}

function hasExRoleUnlocked(id) {
    return trainerExRole.find(t => t.trainerId === id) !== undefined;
}

function getExRoleText(id) {
    const ter = trainerExRole.find(ter => ter.trainerId === id);

    if(ter)
        return role_names[ter.role]

    return "-";
}

function getExRoleId(id) {
    const ter = trainerExRole.find(ter => ter.trainerId === id);

    return ter ? ter.role : -1;
}

function getTrainerNumber(id) {
    return Math.trunc(trainer[id][0].number/100);
}

function getAbilityPanelQty(id) {
    return abilityPanel.filter(ap => ap.trainerId === id && ap.version === 0).length || 0;
}

function removeAccents(string) {
    return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getDayMonthDate(date) {
    let dmDate = date.toLocaleDateString('fr-fr', {day: "numeric"});

    if(dmDate === "1") {
        dmDate += "er";
    }

    return dmDate + ` ${date.toLocaleDateString('fr-fr', {month: "long"})}`;
}

function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(d.setDate(diff));
}

function getYMDDate(date) {
    return `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
}

class Version {
    constructor(version) {
        let expl = version.split(".");

        this.major = parseInt(expl[0]);
        this.minor = parseInt(expl[1]) || 0;
        this.patch = parseInt(expl[2]) || 0;
    }
}

function orderByVersion(data) {

    return data.versions.sort((a, b) => {
        const verA = new Version(a.version);
        const verB = new Version(b.version);

        if(verA.major > verB.major) return -1;
        if(verA.major < verB.major) return 1;

        if(verA.minor > verB.minor) return -1;
        if(verA.minor < verB.minor) return 1;

        if(verA.patch > verB.patch) return -1;
        if(verA.patch < verB.patch) return 1;
    });
}

function getItemName(itemId) {
    let subCategory; // = items.filter(i => i.itemId === itemId)[0].subCategory || -1;
    switch(subCategory) {
        // Trainer.pb
        case 1:

            break;

        // StoryQuest.pb
        case 3:

            break;

        // other_item_name_xx.lsd
        case 4:
        case 6:
        case 7:
        case 9:
        case 10:
        case 41:
        case 45:
        case 53:
        case 58:
        case 60:
        case 65:
        case 66:
        case 67:
        case 95:
        case 111:
        case 112:
        case 134:

            break;

        // breakthrough_item_name_xx.lsd
        case 51:

            break;

        // training_item_name_xx.lsd
        case 52:

            break;

        // potential_item_name_xx.lsd
        case 54:

            break;

        // TrainerBuildupItem.pb
        case 55:

            break;

        // AbilityItem.pb
        case 56:

            break;

        // MoveLevelUpItem.pb
        case 57:

            break;

        // exrole_release_item_name_xx.lsd
        case 59:

            break;

        // MonsterEvolution.pb
        case 61:

            break;

        // trainer_rarity_up_item_name_xx.lsd
        case 68:
        case 69:

            break;

        // bardge_item_name_xx.lsd
        case 73:

            break;

        // villa_item_name_xx.lsd
        case 74:

            break;

        // event_item_name_xx.lsd
        case 75:

            break;

        // deck_item_name_xx.lsd
        case 81:

            break;

        // deck_item_lvup_item_name_xx.lsd
        case 82:

            break;

        // packed_item_name_xx.lsd
        case 83:

            break;

        // EggItem.pb
        case 85:

            break;

        // treat_item_name_xx.lsd
        case 86:

            break;

        // scout_ticket_item_name_xx.lsd
        case 89:

            break;

        // scout_server_ticket_item_name_xx.lsd
        case 90:

            break;

        // MonsterEnhancement.pb
        case 92:

            break;

        // skill_deck_item_skill_feather_item_name_xx.lsd
        case 93:

            break;

        // skill_deck_item_unchanged_pin_item_name_xx.lsd
        case 94:

            break;

        // MissionItem.pb
        case 101:

            break;

        // jukebox_music_key_item_name_xx.lsd
        case 120:

            break;

        // salon_help_item_name_xx.lsd
        case 130:

            break;

        // salon_present_item_name_xx.lsd
        case 131:

            break;

        // SalonPhotoItem.pb
        case 132:

            break;

        // SalonPhotoCustomItem.pb
        case 133:

            break;

        // salon_friendship_level_item_name_xx.lsd
        case 135:

            break;

        // salon_exchange_item_name_xx.lsd
        case 136:
        case 140:
        case 142:
        case 143:

            break;

        // expedition_boost_item_name_xx.lsd
        case 141:

            break;

        // salon_goods_item_name_xx.lsd
        case 150:
        case 152:

            break;

        case 5:
        case 42:
        case 91:
        case 900:
        default:

            break;
    }
}

function outlineBrackets(descr) {
    // Met les balises restantes en gras souligné sur l'aperçu
    return descr.replaceAll(/\[/gi, "<span style='color:yellowgreen;'><strong><u>[")
        .replaceAll(/]/gi, "]</u></strong></span>");
}
