let trainersListDiv;
let passivesDiv;


async function getData() {
    // PROTO
    jsonCache.preloadProto("PassiveSkillChild");
    jsonCache.preloadProto("Schedule");
    jsonCache.preloadProto("TrainerSpecialAwaking");

    // LSD
    jsonCache.preloadLsd("potential_item_name");

    // CUSTOM
    jsonCache.preloadCustom("version_release_dates");

    // Locale
    jsonCache.preloadLocale("special-awaking");

    // Other Preloads
    preloadUtils();
    preloadMovePassiveSkills();

    await jsonCache.runPreload();
    orderByVersion(jData.custom.versionReleaseDates);
}

function listTrainers() {
    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let syncPairTh = document.createElement("th");
    syncPairTh.innerText = jData.locale.specialAwaking.th_sync_pair;
    tr.appendChild(syncPairTh);

    let nameTh = document.createElement("th");
    nameTh.innerText = jData.locale.specialAwaking.th_passive_skill_name;
    tr.appendChild(nameTh);

    let descriptionTh = document.createElement("th");
    descriptionTh.innerText = jData.locale.specialAwaking.th_passive_skill_descr;
    tr.appendChild(descriptionTh);

    thead.appendChild(tr);
    table.appendChild(thead);

    for(let i = 0; i < jData.proto.trainerSpecialAwaking.length; i++) {
        let tr = document.createElement("tr");
        let syncPairTd = document.createElement("td");
        syncPairTd.innerText = getPairName(jData.proto.trainerSpecialAwaking[i].trainerId);
        tr.appendChild(syncPairTd);

        let nameTd = document.createElement("td");
        nameTd.innerText = getPassiveSkillName(jData.proto.trainerSpecialAwaking[i].passiveSkillId);
        tr.appendChild(nameTd);

        let descriptionTd = document.createElement("td");
        descriptionTd.innerText = getPassiveSkillDescr(jData.proto.trainerSpecialAwaking[i].passiveSkillId);
        tr.appendChild(descriptionTd);

        table.appendChild(tr);
    }

    passivesDiv.appendChild(table);
}

async function init() {
    trainersListDiv = document.getElementById("trainersListDiv");
    passivesDiv = document.getElementById("passivesDiv");
    //toolsDiv = document.getElementById('adminTools');

    await buildHeader();
    await getData();

    document.getElementById("pageTitle").innerText = jData.locale.common.submenu_superawakening;

    // if(isAdminMode) {
    //     dataArea = document.getElementById("dataArea");
    //
    //     toolsDiv.style.display = "table";
    //
    //     let downloadAllBtn = document.getElementById("downloadAll");
    //     downloadAllBtn.onclick = downloadAll;
    //
    //     let downloadOneBtn = document.getElementById("downloadOne");
    //     downloadOneBtn.onclick = downloadData;
    //
    //     let copyBtn = document.getElementById("copyBtn");
    //     copyBtn.addEventListener('click', () => navigator.clipboard.writeText(dataArea.value));
    // }

    listTrainers();

    if(window.location.hash !== "" && window.location.hash !== "#") {
        setTimeout(function () {
            let tmp = document.createElement("a");
            tmp.href = window.location.hash;
            tmp.click();
        }, 1000);
    }
}

init().then();
