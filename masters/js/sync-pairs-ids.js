let idTable;


async function getData() {

    // PROTO
    jsonCache.preloadProto("ExRoleStatusUp");
    jsonCache.preloadProto("Monster");
    jsonCache.preloadProto("MonsterEnhancement");
    jsonCache.preloadProto("MonsterEvolution");
    jsonCache.preloadProto("MonsterVariation");
    jsonCache.preloadProto("PotentialItem");
    jsonCache.preloadProto("PotentialLot");
    jsonCache.preloadProto("SpecialAwakingEffect");
    jsonCache.preloadProto("Trainer");
    jsonCache.preloadProto("TrainerBase");
    jsonCache.preloadProto("TrainerBuildupConfig");
    jsonCache.preloadProto("TrainerBuildupParameter");
    jsonCache.preloadProto("TrainerSpecialAwaking");

    // LSD
    jsonCache.preloadLsd("ability_name");
    jsonCache.preloadLsd("monster_description");
    jsonCache.preloadLsd("motif_type_name");
    jsonCache.preloadLsd("special_awaking_level_effect_description");
    jsonCache.preloadLsd("team_skill_tag");
    jsonCache.preloadLsd("team_skill_effect");
    jsonCache.preloadLsd("trainer_description");

    // Locale
    jsonCache.preloadLocale("sync-pairs");
    jsonCache.preloadLocale("lucky-skills");

    // Custom
    jsonCache.preloadCustom("version_release_dates");

    preloadUtils(false);

    await jsonCache.runPreload()
    orderByVersion(jData.custom.versionReleaseDates);

}

function getTrainerUID(t) {
    const tb = jData.proto.trainerBase.find(tb => tb.id.toString() === t.trainerBaseId.toString());
    return tb.actorId === "hero" ? "8000_00" : tb.actorId.substring(2, 9);
}

function getMonsterUID(t, m, variation) {
    const mon = jData.proto.monster.find(mon => mon.monsterId === m);
    const mbid = variation === null ? mon.monsterBaseId : getMonsterBaseIdFromActorId(variation.actorId);
    const mb = jData.proto.monsterBase.find(mb => mb.monsterBaseId.toString() === mbid.toString());

    const dexNumber = mb.dexNumber.toString().padStart(4, "0");
    const actorVariant = mb.actorVariant.toString().padStart(2, "0");
    const shinySuffix = mb.isShiny ? "s" : "";
    let teraTypeSuffix = "";
    if(variation && variation.form === 7) {
        const typeId = variation.type > 0 ? variation.type : t.type;
        teraTypeSuffix = `-${typeId.toString().padStart(2, "0")}`;
    }

    return `${dexNumber}_${actorVariant}${shinySuffix}${teraTypeSuffix}`;
}

function getUID(t, m = null, variation = null) {
    let uid = "";
    uid = getTrainerUID(t);
    uid += "-";
    uid += getMonsterUID(t, m === null ? t.monsterId : m, variation);

    return uid;
}

function getEvoData(t, taid) {
    const evos = jData.proto.monsterEvolution.filter(me => me.trainerId === t.trainerId);
    let data = [];

    if(evos.length === 0) return data;

    evos.forEach(evo => {
        const mon = jData.proto.monster.find(mon => mon.monsterId.toString() === evo.monsterIdNext.toString());
        const mb = jData.proto.monsterBase.find(mb => mb.monsterBaseId.toString() === mon.monsterBaseId.toString());

        let evoData = {
            "name": `${getTrainerName(evo.trainerId)} & ${getMonsterNameByMonsterId(evo.monsterIdNext)}`,
            "uid": getUID(t, evo.monsterIdNext),
            "tid": evo.trainerId,
            "taid": taid,
            "mid": evo.monsterIdNext,
            "maid": mb.actorId
        };
        data.push(evoData);
    });

    return data;
}

function getPairData(t) {
    let data = [];

    const mon = jData.proto.monster.find(mon => mon.monsterId.toString() === t.monsterId.toString());
    const mb = jData.proto.monsterBase.find(mb => mb.monsterBaseId.toString() === mon.monsterBaseId.toString());
    const taid = jData.proto.trainerBase.find(tb => tb.id.toString() === t.trainerBaseId.toString()).actorId;

    let pairData = {
        "name": getPairName(t.trainerId),
        "uid": getUID(t),
        "tid": t.trainerId,
        "taid": taid,
        "mid": t.monsterId,
        "maid": mb.actorId
    };

    data.push(pairData);
    data.push(...getEvoData(t, taid))

    data.forEach(d => {
        let variations = jData.proto.monsterVariation.filter(mv => mv.monsterId.toString() === d.mid.toString() && mv.form !== 4);

        if(variations.length === 0) return;

        variations.forEach(variation => {
            let variationData = {
                "name": `${getTrainerName(t.trainerId)} & ${getNameByMonsterBaseId(getMonsterBaseIdFromActorId(variation.actorId), variation.formId)}`,
                "uid": getUID(t, variation.monsterId, variation),
                "tid": t.trainerId,
                "taid": taid,
                "mid": variation.monsterId,
                "maid": variation.actorId
            };
            data.push(variationData);
        });
    })

    return data;
}

function setTable() {
    idTable.innerHTML = "";
    idTable.classList.add("bipcode");
    idTable.style.textAlign = "center";

    let thead = document.createElement("thead");

    let headerRow = document.createElement("tr");
    let headers = ["Sync Pair", "Unified ID", "Trainer ID", "Tr Actor ID", "Monster ID", "Mon Actor ID"];
    headers.forEach(headerText => {
        let th = document.createElement("th");
        th.innerText = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    idTable.appendChild(thead);

    let tbody = document.createElement("tbody");

    let dataTable;

    jData.proto.trainer.filter(t => t.number !== 99900).forEach(t => {
        dataTable = getPairData(t);

        dataTable.forEach(d => {
            let tr = document.createElement("tr");
            let syncPairTd = document.createElement("td");
            syncPairTd.innerText = d.name;
            tr.appendChild(syncPairTd);

            let uidTd = document.createElement("td");
            uidTd.innerHTML = `<strong>${d.uid}</strong>`;
            tr.appendChild(uidTd);

            let tidTd = document.createElement("td");
            tidTd.innerText = d.tid;
            tr.appendChild(tidTd);

            let taidTd = document.createElement("td");
            taidTd.innerText = d.taid;
            tr.appendChild(taidTd);

            let midTd = document.createElement("td");
            midTd.innerText = d.mid;
            tr.appendChild(midTd);
            tbody.appendChild(tr);

            let maidTd = document.createElement("td");
            maidTd.innerText = d.maid;
            tr.appendChild(maidTd);
        })
    });
    idTable.appendChild(tbody);
}

async function init() {
    idTable = document.getElementById("idTable");

    await buildHeader();
    await getData();

    setTable();
}

init().then();
