
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

const typeToFieldTextTag = {
    "1" : "125",
    "2" : "108",
    "3" : "109",
    "4" : "114",
    "5" : "113",
    "6" : "115",
    "7" : "119",
    "8" : "124",
    "9" : "118",
    "10" : "122",
    "11" : "112",
    "12" : "127",
    "13" : "126",
    "14" : "116",
    "15" : "117",
    "16" : "123",
    "17" : "120",
    "18" : "121",
}

function preloadUtils(preloadItems = false) {

    // Proto
    jsonCache.preloadProto(`AbilityPanel`);
    jsonCache.preloadProto(`ActorDress`);
    jsonCache.preloadProto(`Monster`);
    jsonCache.preloadProto(`MonsterBase`);
    jsonCache.preloadProto(`Move`);
    jsonCache.preloadProto(`ReplaceActorKeyword`);
    jsonCache.preloadProto(`Trainer`);
    jsonCache.preloadProto(`TrainerBase`);
    jsonCache.preloadProto(`TrainerDress`);
    jsonCache.preloadProto(`TrainerExRole`);
    jsonCache.preloadProto(`TextTagValue`);

    // Standard LSD
    jsonCache.preloadLsd(`abnormal_state`);
    jsonCache.preloadLsd(`monster_form`);
    jsonCache.preloadLsd(`monster_name`);
    jsonCache.preloadLsd(`motif_type_name`);
    jsonCache.preloadLsd(`trainer_name`);
    jsonCache.preloadLsd(`trainer_verbose_name`);

    if(preloadItems) {
        // Item Proto
        jsonCache.preloadProto(`AbilityItem`);
        jsonCache.preloadProto(`EventExchangeItem`);
        jsonCache.preloadProto(`Item`);
        jsonCache.preloadProto(`MonsterEnhancement`);
        jsonCache.preloadProto(`MoveLevelUpItem`);
        jsonCache.preloadProto(`SpecialAwakingLevelUpItem`);
        jsonCache.preloadProto(`StoryQuest`);
        jsonCache.preloadProto(`TrainerBuildupItem`);

        // Item LSD
        jsonCache.preloadLsd(`ability_item_name`);
        jsonCache.preloadLsd(`bardge_item_name`);
        jsonCache.preloadLsd(`breakthrough_item_name`);
        jsonCache.preloadLsd(`deck_item_lvup_item_name`);
        jsonCache.preloadLsd(`deck_item_name`);
        jsonCache.preloadLsd(`expedition_boost_item_name`);
        jsonCache.preloadLsd(`exrole_release_item_name`);
        jsonCache.preloadLsd(`event_item_name`);
        jsonCache.preloadLsd(`hero_customize_parts_name`);
        jsonCache.preloadLsd(`jukebox_music_key_item_name`);
        jsonCache.preloadLsd(`move_levelup_item_name`);
        jsonCache.preloadLsd(`other_item_name`);
        jsonCache.preloadLsd(`packed_item_name`);
        jsonCache.preloadLsd(`potential_item_name`);
        jsonCache.preloadLsd(`salon_exchange_item_name`);
        jsonCache.preloadLsd(`salon_friendship_level_item_name`);
        jsonCache.preloadLsd(`salon_goods_item_name`);
        jsonCache.preloadLsd(`salon_help_item_name`);
        jsonCache.preloadLsd(`salon_present_item_name`);
        jsonCache.preloadLsd(`scout_server_ticket_item_name`);
        jsonCache.preloadLsd(`scout_ticket_item_name`);
        jsonCache.preloadLsd(`skill_deck_item_skill_feather_item_name`);
        jsonCache.preloadLsd(`skill_deck_item_unchanged_pin_item_name`);
        jsonCache.preloadLsd(`story_quest_name`);
        jsonCache.preloadLsd(`trainer_buildup_item_name`);
        jsonCache.preloadLsd(`trainer_rarity_up_item_name`);
        jsonCache.preloadLsd(`training_item_name`);
        jsonCache.preloadLsd(`treat_item_name`);
        jsonCache.preloadLsd(`villa_item_name`);
    }
}

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
            if(jData.proto.move.find(m => m.moveId === ability.moveId).group === "Sync") {
                return abilityType[5];
            }

            return abilityType[4];
    }
}

function getPairPrettyPrint(trainerId) {
    return `${getStarsRarityString(trainerId)} ${getPairName(trainerId)}`;
}

function getPairName(trainerId) {
    return `${getTrainerName(trainerId)} & ${getMonsterNameByTrainerId(trainerId)}`;
}

function getStarsRarityString(trainerId) {
    return `<span style="color: ${starsHex[getTrainerRarity(trainerId)-1]}; -webkit-text-stroke: thin black;"><b>${"★".repeat(getTrainerRarity(trainerId))}</b></span>`;
}

function getPairPrettyPrintWithUrl(trainerId) {
    return `<a href="./duo.html?pair=${trainerId}">${getPairPrettyPrint(trainerId)}</a>`;
}

function getTrainerName(id) {
    if (jData.lsd.trainerVerboseName[id])
        return jData.lsd.trainerVerboseName[id].replace("\n", " ");

    let tr = jData.proto.trainer.find(t => t.trainerId === id) || {};
    let tb = jData.proto.trainerBase.find(tba => tba.id === tr.trainerBaseId?.toString()) || {};

    return (jData.lsd.trainerName[tb.altTrainerNameId] || jData.lsd.trainerName[tb.trainerNameId] || jData.locale.common.base_trainer_name).replace("\n", " ");
}

function getMonsterNameByTrainerId(id) {
    let tr = jData.proto.trainer.find(t => t.trainerId === id) || {};
    let mon = jData.proto.monster.find(m => m.monsterId.toString() === tr.monsterId?.toString()) || {};
    let mb = jData.proto.monsterBase.find(mb => mb.monsterBaseId === mon.monsterBaseId) || {};
    return jData.lsd.monsterName[mb.monsterNameId] || "";
}

function getMonsterNameByMonsterId(id) {
    let mon = jData.proto.monster.find(m => m.monsterId.toString() === id.toString()) || {};
    return getNameByMonsterBaseId(mon.monsterBaseId);
}

function getNameByMonsterBaseId(id, formId = 0) {
    let mb = jData.proto.monsterBase.find(mb => mb.monsterBaseId === id) || {};
    let name = jData.lsd.monsterName[mb.monsterNameId] || "";

    if(formId > 0 && jData.lsd.monsterForm[formId]) {
        name += ` ${jData.lsd.monsterForm[formId]}`;
    }

    else if(mb.formId && mb.formId > 0 && jData.lsd.monsterForm[mb.formId]) {
        name += ` ${jData.lsd.monsterForm[mb.formId]}`;
    }
    return name;

}

function getTrainerActorId(trainerId) {
    let trainerBaseId = jData.proto.trainer.find(t => t.trainerId === trainerId).trainerBaseId;
    let actorId = jData.proto.trainerBase.find(tb => tb.id === trainerBaseId.toString()).actorId;


    if(actorId) {
        let rak = jData.proto.replaceActorKeyword.find(rak => rak.replacedActorId === actorId);

        if(rak) {
            let replacingActorTrainer = jData.proto.trainerBase.find(tb => tb.actorId ===  rak.replacingActorId);

            if(replacingActorTrainer && (!replacingActorTrainer.isGeneric || rak.useGenericIfAvailable))
                actorId = rak.replacingActorId;
        }
    }

    return actorId;
}

function getActorDressFromTrainerId(trainerId) {
    let val = jData.proto.trainerDress.find(td => td.trainerId == trainerId);

    if(!val)
        return null;

    return jData.proto.actorDress.find(ad => ad.id == val.actorDressId);
}

function getMonsterBaseIdFromMonsterId(monsterId) {
    return jData.proto.monster.find(m => m.monsterId === monsterId).monsterBaseId;
}

function getMonsterBaseIdFromActorId(actorId) {
    return jData.proto.monsterBase.find(mb => mb.actorId === actorId).monsterBaseId || -1;
}

function getPokemonNumberFromMonsterBaseId(monsterBaseId) {
    return jData.proto.monsterBase.find(mb => mb.monsterBaseId === monsterBaseId).actorNumber;
}

function getMonsterActorIdFromBaseId(baseId) {
    return jData.proto.monsterBase.find(mb => mb.monsterBaseId === baseId).actorId;
}

function getMonsterById(monsterId) {
    return jData.proto.monster.find(m => m.monsterId === monsterId);
}

function getRoleByTrainerId(id, standard = false) {
    const role = jData.proto.trainer.find(t => t.trainerId === id).role;

    return standard ? jData.locale.common.role_name_standard[role] : jData.locale.common.role_names[role];
}

function getRoleUrlByTrainerId(id, specification = true) {
    const role = jData.proto.trainer.find(t => t.trainerId === id).role;

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
            return removeAccents(jData.locale.common.role_names[role].toLowerCase());
    }
}

function getExRoleUrlByTrainerId(id, specification = true) {
    const role = jData.proto.trainerExRole.find(t => t.trainerId === id).role;

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
            return removeAccents(jData.locale.common.role_names[role].toLowerCase());
    }
}

function getTrainerTypeName(id) {
    return jData.lsd.motifTypeName[jData.proto.trainer.find(t => t.trainerId === id).type];
}

function getTrainerWeaknessName(id) {
    return jData.lsd.motifTypeName[jData.proto.trainer.find(t => t.trainerId === id).weakness];
}

function getTrainerRarity(id) {
    return jData.proto.trainer.find(t => t.trainerId === id).rarity;
}

function hasExUnlocked(id) {
    return jData.proto.trainer.find(t => t.trainerId === id).exScheduleId !== "NEVER";
}

function hasExRoleUnlocked(id) {
    return jData.proto.trainerExRole.find(t => t.trainerId === id) !== undefined;
}

function getFieldEffect(type) {
    return jData.lsd.abnormalState[jData.proto.textTagValue.find(t => t.textTagValueId === typeToFieldTextTag[type]).value];
}

function getExSyncEffect(roleId, type) {
    switch(roleId) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
            return jData.locale.common.ex_sync_effect[roleId];

        case 5:
            return jData.locale.common.ex_sync_effect[roleId].replace("[Name:FieldEffectType ]", getFieldEffect(type));

        case 6:
            return jData.locale.common.ex_sync_effect[roleId].replace("[Name:Type ]", jData.lsd.motifTypeName[type]);
    }
}

function getExRoleText(id) {
    const ter = jData.proto.trainerExRole.find(ter => ter.trainerId === id);

    if(ter)
        return jData.locale.common.role_names[ter.role]

    return "-";
}

function getExRoleId(id) {
    const ter = jData.proto.trainerExRole.find(ter => ter.trainerId === id);

    return ter ? ter.role : -1;
}

function getTrainerNumber(id) {
    const t = jData.proto.trainer.find(t => t.trainerId === id);

    return t ? Math.trunc(t.number / 100) : -1;
}

function getAbilityPanelQty(id) {
    return jData.proto.abilityPanel.filter(ap => ap.trainerId === id && ap.version === 0).length || 0;
}

function removeAccents(string) {
    return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[)('.]/g, "");
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

    return data.sort((a, b) => {
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

function getNormalizedItemName(itemId) {
    return removeAccents(getItemName(itemId)).toLowerCase().replaceAll(" ", "-");
}

function getItemName(itemId, log = false) {
    let lsdName = "";
    let fieldName = itemId;
    let prefix = "";
    let subCategory = jData.proto.item.find(i => i.itemId === itemId);
    subCategory = subCategory && subCategory.subCategory ? subCategory.subCategory : -1;
    switch(subCategory) {
        // Trainer.pb
        case 1:
            return getPairName(itemId);

        // StoryQuest.pb
        // story_quest_name_xx.lsd => quest_title_{id}
        case 3:
            fieldName = jData.proto.storyQuest.find(sq => sq.storyQuestId === itemId).questNameId || "";
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
            const tbi = jData.proto.trainerBuildupItem.find(tbi => tbi.itemId === itemId);
            return jData.lsd.trainerBuildupItemName[tbi.trainerBuildupConfigId] + (tbi.trainerId.toString() === "-1" ? "" : ` (${getPairName(tbi.trainerId)})`);

        // AbilityItem.pb
        case 56:
            const trainerId = jData.proto.abilityItem.find(ai => ai.itemId === itemId)["trainerId"] || -1;
            return jData.lsd.abilityItemName[trainerId === "0" ? "1" : "2"] + (trainerId === "0" ? "" : " (" + getPairName(trainerId) + ")");

        // MoveLevelUpItem.pb
        case 57:
            let valId = parseInt(itemId.slice(-4)).toString();
            if(valId <= 12)
                valId++;

            const moveLevelUpItem = jData.proto.moveLevelUpItem.find(mlui => mlui.itemId === itemId);
            switch (moveLevelUpItem.paramType) {
                case 1:
                case 2:
                case 3:
                    return jData.lsd.moveLevelupItemName[valId];

                case 4:
                    return jData.lsd.moveLevelupItemName["60"] + ` (${getPairName(moveLevelUpItem.param)})`;
            }
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

            let eventExchangeItem = jData.proto.eventExchangeItem.find(ei => ei.itemId === itemId);
            if(eventExchangeItem && eventExchangeItem.itemNameOverride !== "-1") {
                fieldName = eventExchangeItem.itemNameOverride;
            }
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
            let enhancement = jData.proto.monsterEnhancement.find(me => me.monsterEnhancementId === itemId);
            if(enhancement) {
                return `${getPairName(enhancement.trainerId)} ${jData.locale.common.enhancement}`;
            }
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
            fieldName = itemId.slice(4);
            lsdName = `hero_customize_parts_name`
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

        // SpecialAwakingLevelUpItem.pb
        case 180:
            let saLevelUpItem = jData.proto.specialAwakingLevelUpItem.find(salui => salui.itemId === itemId);
            if(saLevelUpItem && saLevelUpItem.type === 2) {
                return jData.lsd.otherItemName[parseInt(saLevelUpItem.itemId) - parseInt(saLevelUpItem.trainerId) + 1]
                    + (saLevelUpItem.trainerId === "0" ? "" : " (" + getPairName(saLevelUpItem.trainerId) + ")");
            }

            lsdName = `other_item_name`;
            break;

        // Inconnus...
        case 91:
        case 900:
        default:
            return "Unknown Item";
    }

    if(lsdName === "") {
        console.log(`Item category ${subCategory} not yet implemented...`);
        console.log(`Item ID: ${itemId}`);
        return "Item category not yet implemented...";
    }

    return (prefix === "" ? "" : `${prefix} `) + (jData.lsd[jsonCache.standardizeName(lsdName)][fieldName] || "Unknown Item");

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
