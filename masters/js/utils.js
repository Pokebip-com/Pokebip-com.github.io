
const starsHex = ["#FFFFFF", "#bed9db", "#cfb19e", "#cbdbe3", "#ebe59a"];
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

function getAbilityType(ability) {
    switch(ability.type) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
            //stat boosts
            return abilityType[1];

        case 7:
            //Passive
            return abilityType[2];

        case 8:
            //additional move effect
            return abilityType[3];

        case 9:
        case 10:
            //move power/accuracy boost
            if(move.find(m => m.moveId === ability.moveId).group === "Sync") {
                return abilityType[5];
            }

            return abilityType[4];
    }
}

async function getPairPrettyPrint(trainerId) {
    return `${await getStarsRarityString(trainerId)} ${await getPairName(trainerId)}`;
}

async function getPairName(trainerId) {
    return `${await getTrainerName(trainerId)} & ${await getMonsterNameByTrainerId(trainerId)}`;
}

async function getStarsRarityString(trainerId) {
    return `<span style="color: ${starsHex[await getTrainerRarity(trainerId)-1]}; -webkit-text-stroke: thin black;"><b>${"★".repeat(await getTrainerRarity(trainerId))}</b></span>`;
}

async function getPairPrettyPrintWithUrl(trainerId) {
    return `<a href="./duo.html?pair=${trainerId}">${await getPairPrettyPrint(trainerId)}</a>`;
}

async function getTrainerName(id) {
    let trainerVerboseNames = await jsonCache.getLsd(`trainer_verbose_name`);
    if (trainerVerboseNames[id])
        return trainerVerboseNames[id].replace("\n", " ");

    let trainerNames = await jsonCache.getLsd(`trainer_name`);
    let tr = (await jsonCache.getProto(`Trainer`))
            .find(t => t.trainerId === id) || {};
    let tb = (await jsonCache.getProto(`TrainerBase`))
            .find(tba => tba.id === tr.trainerBaseId?.toString()) || {};

    return (trainerNames[tb.altTrainerNameId] || trainerNames[tb.trainerNameId] || commonLocales.base_trainer_name).replace("\n", " ");
}

async function getMonsterNameByTrainerId(id) {
    let tr = (await jsonCache.getProto(`Trainer`)).find(t => t.trainerId === id) || {};
    let mon = (await jsonCache.getProto(`Monster`)).find(m => m.monsterId.toString() === tr.monsterId?.toString()) || {};
    let mb = (await jsonCache.getProto(`MonsterBase`)).find(mb => mb.monsterBaseId === mon.monsterBaseId) || {};
    return (await jsonCache.getLsd(`monster_name`))[mb.monsterNameId] || "";
}

async function getMonsterNameByMonsterId(id) {
    let mon = (await jsonCache.getProto(`Monster`)).find(m => m.monsterId.toString() === id.toString()) || {};
    return await getNameByMonsterBaseId(mon.monsterBaseId);
}

async function getNameByMonsterBaseId(id, formId = 0) {
    let mb = (await jsonCache.getProto(`MonsterBase`)).find(mb => mb.monsterBaseId === id) || {};
    let name = (await jsonCache.getLsd(`monster_name`))[mb.monsterNameId] || "";

    let monsterForms = await jsonCache.getLsd(`monster_form`);

    if(formId > 0 && monsterForms[formId]) {
        name += ` ${monsterForms[formId]}`;
    }

    else if(mb.formId && mb.formId > 0 && monsterForms[mb.formId]) {
        name += ` ${monsterForms[mb.formId]}`;
    }
    return name;

}

async function getTrainerActorId(trainerId) {
    let trainerBaseId = (await jsonCache.getProto("Trainer")).find(t => t.trainerId === trainerId).trainerBaseId;
    let actorId = (await jsonCache.getProto("TrainerBase")).find(tb => tb.id === trainerBaseId.toString()).actorId;

    if(actorId) {
        let rak = (await jsonCache.getProto("ReplaceActorKeyword")).find(rak => rak.replacedActorId === actorId);

        if(rak) {
            let replacingActorTrainer = (await jsonCache.getProto("TrainerBase")).find(tb => tb.actorId ===  rak.replacingActorId);

            if(replacingActorTrainer && (!replacingActorTrainer.isGeneric || rak.useGenericIfAvailable))
                actorId = rak.replacingActorId;
        }
    }

    return actorId;
}

async function getActorDressFromTrainerId(trainerId) {
    let val = (await jsonCache.getProto("ActorDress")).find(td => td.trainerId == trainerId);

    if(!val)
        return null;

    return (await jsonCache.getProto("ActorDress")).find(ad => ad.id == val.actorDressId);
}

async function getFormIdFromActorId(actorId) {
    return (await jsonCache.getProto("MonsterBase")).find(mb => mb.actorId === actorId).formId || -1;
}

async function getMonsterBaseIdFromMonsterId(monsterId) {
    return (await jsonCache.getProto("Monster")).find(m => m.monsterId === monsterId).monsterBaseId;
}

async function getMonsterBaseIdFromActorId(actorId) {
    return (await jsonCache.getProto("MonsterBase")).find(mb => mb.actorId === actorId).monsterBaseId || -1;
}

async function getPokemonNumberFromMonsterBaseId(monsterBaseId) {
    return (await jsonCache.getProto("MonsterBase")).find(mb => mb.monsterBaseId === monsterBaseId).actorNumber;
}

async function getMonsterActorIdFromBaseId(baseId) {
    return (await jsonCache.getProto("MonsterBase")).find(mb => mb.monsterBaseId === baseId).actorId;
}

async function getMonsterById(monsterId) {
    return (await jsonCache.getProto("Monster")).find(m => m.monsterId === monsterId);
}

async function getRoleByTrainerId(id, standard = false) {
    const role = (await jsonCache.getProto("Trainer")).find(t => t.trainerId === id).role;

    return standard ? commonLocales.role_name_standard[role] : commonLocales.role_names[role];
}

async function getRoleUrlByTrainerId(id, specification = true) {
    const role = (await jsonCache.getProto("Trainer")).find(t => t.trainerId === id).role;

    switch(role) {
        case 0:
        case 1:
            if(!specification)
                return "attaquant";
        case 0:
            return "attaquant-physique";
        case 1:
            return "attaquant-special";
        default:
            return removeAccents(commonLocales.role_names[role].toLowerCase());
    }
}

async function getExRoleUrlByTrainerId(id, specification = true) {
    const role = (await jsonCache.getProto("TrainerExRole")).find(t => t.trainerId === id).role;

    switch(role) {
        case 0:
        case 1:
            if(!specification)
                return "attaquant";
        case 0:
            return "attaquant-physique";
        case 1:
            return "attaquant-special";
        default:
            return removeAccents(commonLocales.role_names[role].toLowerCase());
    }
}

async function getTrainerTypeName(id) {
    return (await jsonCache.getLsd("motif_type_name"))[(await jsonCache.getProto("Trainer")).find(t => t.trainerId === id).type];
}

async function getTrainerWeaknessName(id) {
    return (await jsonCache.getLsd("motif_type_name"))[(await jsonCache.getProto("Trainer")).find(t => t.trainerId === id).weakness];
}

async function getTrainerRarity(id) {
    return (await jsonCache.getProto("Trainer")).find(t => t.trainerId === id).rarity;
}

async function hasExUnlocked(id) {
    return (await jsonCache.getProto("Trainer")).find(t => t.trainerId === id).exScheduleId !== "NEVER";
}

async function hasExRoleUnlocked(id) {
    return (await jsonCache.getProto("TrainerExRole")).find(t => t.trainerId === id) !== undefined;
}

async function getExRoleText(id) {
    const ter = (await jsonCache.getProto("TrainerExRole")).find(ter => ter.trainerId === id);

    if(ter)
        return commonLocales.role_names[ter.role]

    return "-";
}

async function getExRoleId(id) {
    const ter = (await jsonCache.getProto("TrainerExRole")).find(ter => ter.trainerId === id);

    return ter ? ter.role : -1;
}

function getTrainerNumber(id) {
    return Math.trunc(trainer[id][0].number/100);
}

async function getAbilityPanelQty(id) {
    return (await jsonCache.getProto("AbilityPanel")).filter(ap => ap.trainerId === id && ap.version === 0).length || 0;
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

async function getNormalizedItemName(itemId) {
    return await getItemName(itemId)
        .then(itemName => removeAccents(itemName).toLowerCase().replaceAll(" ", "-"));
}

async function getItemName(itemId) {
    let lsdName = "";
    let fieldName = itemId;
    let prefix = "";
    let subCategory = (await jsonCache.getProto("Item")).find(i => i.itemId === itemId).subCategory;
    subCategory = subCategory ? subCategory : -1;
    switch(subCategory) {
        // Trainer.pb
        case 1:
            return await getPairName(itemId);

        // StoryQuest.pb
        // story_quest_name_xx.lsd => quest_title_{id}
        case 3:
            fieldName = (await jsonCache.getProto("StoryQuest")).find(sq => sq.storyQuestId === itemId).questNameId || "";
            lsdName = `story_quest_name`;
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
        case 78:
        case 79:
        case 95:
        case 111:
        case 112:
        case 134:
            lsdName = `other_item_name`;
            break;

        // RewardConfigId.pb
        // item_id.exp
        case 5:
            return "XP";

        // ChequeManagementItem.pb
        case 42:
            return "Paid Login Bonus Reward"

        // breakthrough_item_name_xx.lsd
        case 51:
            lsdName = `breakthrough_item_name`;
            break;

        // training_item_name_xx.lsd
        case 52:
            lsdName = `training_item_name`;
            break;

        // potential_item_name_xx.lsd
        case 54:
            lsdName = `potential_item_name`;
            break;

        // TrainerBuildupItem.pb
        case 55:
            const tbi = (await jsonCache.getProto("TrainerBuildupItem")).find(tbi => tbi.itemId === itemId);
            return (await jsonCache.getLsd("trainer_buildup_item_name"))[tbi.trainerBuildupConfigId] + (tbi.trainerId.toString() === "-1" ? "" : ` (${await getPairName(tbi.trainerId)})`);

        // AbilityItem.pb
        case 56:
            const trainerId = (await jsonCache.getProto("AbilityItem")).find(ai => ai.itemId === itemId)["trainerId"] || -1;
            return (await jsonCache.getLsd(`ability_item_name`))[trainerId === "0" ? "1" : "2"] + (trainerId === "0" ? "" : " (" + await getPairName(trainerId) + ")");

        // MoveLevelUpItem.pb
        case 57:

            break;

        // exrole_release_item_name_xx.lsd
        case 59:
            lsdName = `exrole_release_item_name`;
            break;

        // MonsterEvolution.pb
        case 61:

            break;

        // trainer_rarity_up_item_name_xx.lsd
        case 68:
        case 69:
            lsdName = `trainer_rarity_up_item_name`;
            break;

        // bardge_item_name_xx.lsd
        case 73:
            lsdName = `bardge_item_name`;
            break;

        // villa_item_name_xx.lsd
        case 74:
            lsdName = `villa_item_name`;
            break;

        // event_item_name_xx.lsd
        case 75:
            lsdName = `event_item_name`;
            break;

        // BattleRallyItem.pb
        case 76:

            break;

        // BattleRallyTicketItem.pb => other_item_name
        case 77:

            break;

        // deck_item_name_xx.lsd
        case 81:
            lsdName = `deck_item_name`;
            break;

        // deck_item_lvup_item_name_xx.lsd
        case 82:
            lsdName = `deck_item_lvup_item_name`;
            break;

        // packed_item_name_xx.lsd
        case 83:
            lsdName = `packed_item_name`;
            break;

        // EggItem.pb
        case 85:

            break;

        // treat_item_name_xx.lsd
        case 86:
            lsdName = `treat_item_name`;
            break;

        // scout_ticket_item_name_xx.lsd
        case 89:
            lsdName = `scout_ticket_item_name`;
            break;

        // scout_server_ticket_item_name_xx.lsd
        case 90:
            lsdName = `scout_server_ticket_item_name`;
            break;

        // MonsterEnhancement.pb
        case 92:

            break;

        // skill_deck_item_skill_feather_item_name_xx.lsd
        case 93:
            lsdName = `skill_deck_item_skill_feather_item_name`;
            break;

        // skill_deck_item_unchanged_pin_item_name_xx.lsd
        case 94:
            lsdName = `skill_deck_item_unchanged_pin_item_name`;
            break;

        // MissionItem.pb
        case 101:

            break;

        // jukebox_music_key_item_name_xx.lsd
        case 120:
            lsdName = `jukebox_music_key_item_name`;
            break;

        // RewardConfig.Pb
        // => item_set_id_at_duplication.{itemId} => ItemSetId => Item
        case 121:

            break;

        // salon_help_item_name_xx.lsd
        case 130:
            lsdName = `salon_help_item_name`;
            break;

        // salon_present_item_name_xx.lsd
        case 131:
            lsdName = `salon_present_item_name`;
            break;

        // SalonPhotoItem.pb
        case 132:

            break;

        // SalonPhotoCustomItem.pb
        case 133:

            break;

        // salon_friendship_level_item_name_xx.lsd
        case 135:
            lsdName = `salon_friendship_level_item_name`;
            break;

        // salon_exchange_item_name_xx.lsd
        case 136:
        case 140:
        case 142:
        case 143:
            lsdName = `salon_exchange_item_name`;
            break;

        // expedition_boost_item_name_xx.lsd
        case 141:
            lsdName = `expedition_boost_item_name`;
            break;

        // salon_goods_item_name_xx.lsd
        case 150:
        case 152:
            lsdName = `salon_goods_item_name`;
            break;

        // SalonMemorialArtItem.pb
        case 151:

            break;

        // SalonGoodsItem.pb
        case 153:

            break;

        // HonorItem.pb
        case 160:

            break;

        // PhotoMakerDecorationItem.pb
        case 170:

            break;

        // Inconnus...
        case 91:
        case 900:
        default:
            return "Unknown Item";
    }

    if(lsdName === "")
        return "Item category not yet implemented...";

    return (prefix === "" ? "" : `${prefix} `) + (await jsonCache.getLsd(lsdName))[fieldName] || "Unknown Item";

}

function outlineBrackets(descr) {
    // Met les balises restantes en gras souligné sur l'aperçu
    return descr.replaceAll(/\[/gi, "<span style='color:yellowgreen;'><strong><u>[")
        .replaceAll(/]/gi, "]</u></strong></span>");
}

function agenderDescription(descr) {
    // Types = [ "FR" ]
    // SubTypes = [ "Gen" ]
    // FR: Gen
    // Params = [ "M", "F", "Ref" ]

    if(!descr)
        return descr;

    let bracketValues = (descr.match(/(?<=\[)[^\][]*(?=])/g) || []).map(match => `[${match}]`);

    for(let i = 0; i < bracketValues.length; i++) {
        let type = bracketValues[i].match(/(?<=\[)(.*?)(?=:)/g)[0];
        let subtype = bracketValues[i].match(/(?<=:)(.*?)(?=\s)/g)[0];
        let params = (bracketValues[i]
            .match(/(?<=\s)(.*?=.*?)(?=\s)/g) || [])
            .map(p => {
                let m = p.match(/^([^=]*)="(.*)"/).slice(1,3);
                return { [m[0]] : m[1] };
            })
            .reduce((acc, curr) => Object.assign(acc, curr), {});

        let replaceValue = "";

        delete params.Ref;

        switch(Object.keys(params).length) {
            case 1:
                replaceValue = `/${params[Object.keys(params)[0]]}`;
                break;

            case 2:
                replaceValue = `${params["M"]}/${params["F"]}`;
                break;

            default:
                console.warn("Unable to handle params : ", params);
                break;
        }

        descr = descr.replace(bracketValues[i], replaceValue);
    }


    return descr;
}
