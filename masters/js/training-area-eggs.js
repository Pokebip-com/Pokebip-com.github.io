let tablesDiv;

let eggGroups = [80900013, 80900023, 80900033, 80900043, 80900053, 80900063];


async function getData() {

    // PROTO
    jsonCache.preloadProto("EggLotGroup");
    jsonCache.preloadProto("FarmMonster");

    // LSD

    // Locale

    preloadUtils(false);

    await jsonCache.runPreload()

}

function setTable(eggGroup) {
    let li = document.createElement("li");
    li.classList.add("listh-bipcode");
    li.style.textAlign = "center";
    li.style.padding = "0";

    let groupTable = document.createElement("table");

    groupTable.classList.add("bipcode");
    groupTable.style.textAlign = "center";

    let thead = document.createElement("thead");

    let headerRow = document.createElement("tr");
    let headers = ["Pokémon", "Type", "Role", "Nb passifs", "Shiny ?"];
    headers.forEach(headerText => {
        let th = document.createElement("th");
        th.innerText = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    groupTable.appendChild(thead);

    let tbody = document.createElement("tbody");

    let lastMonName = "";
    let lastGender = -1;
    let types = [];

    jData.proto.eggLotGroup
        .filter(elg => elg.eggLotGroupId === eggGroup)
        .map(elg => {
            let fm = jData.proto.farmMonster.find(fm => fm.farmMonsterId === elg.farmMonsterId);
            fm.monsterBaseId = getMonsterBaseIdFromTrainerId(fm.trainerId);
            fm.gender = jData.proto.monsterBase.find(mb => mb.monsterBaseId === fm.monsterBaseId).gender;
            fm.monName = getMonsterNameByTrainerId(fm.trainerId);
            fm.trainer = jData.proto.trainer.find(t => t.trainerId === fm.trainerId);
            fm.type = jData.lsd.motifTypeName[fm.trainer.type];
            fm.role = jData.locale.common.role_names[fm.trainer.role];
            return fm;
        })
        .sort((a, b) => a.trainer.type - b.trainer.type || a.monName.localeCompare(b.monName) || a.role.localeCompare(b.role) || a.nbPassives - b.nbPassives || a.isShiny - b.isShiny)
        .forEach(farmMon => {

            if(farmMon.monName === lastMonName && farmMon.gender !== lastGender) {
                return;
            }

            types.push({ typeName: farmMon.type, order: farmMon.trainer.type });

            lastMonName = farmMon.monName;
            lastGender = farmMon.gender;

            let groupRow = document.createElement("tr");

            const nbPassives = farmMon.nbPassives;
            const isShiny = farmMon.isShiny;
            const role = farmMon.role;
            const mon = farmMon.monName;

            let monTd = document.createElement("td");
            monTd.innerText = mon;
            groupRow.appendChild(monTd);

            let typeTd = document.createElement("td");
            typeTd.innerText = farmMon.type;
            groupRow.appendChild(typeTd);

            let roleTd = document.createElement("td");
            roleTd.innerText = role;
            groupRow.appendChild(roleTd);

            let nbPassivesTd = document.createElement("td");
            nbPassivesTd.innerText = nbPassives;
            groupRow.appendChild(nbPassivesTd);

            let shinyTd = document.createElement("td");
            shinyTd.innerText = isShiny ? "Oui" : "Non";
            groupRow.appendChild(shinyTd);

            tbody.appendChild(groupRow);
        });
    groupTable.appendChild(tbody);

    types = [...new Set(types
        .sort((a, b) => a.order - b.order || a.typeName.localeCompare(b.typeName))
        .map(t => t.typeName)
    )];

    let h1 = document.createElement("h1");
    h1.innerText = types.slice(0, -1).join(", ") + (types.length > 1 ? " & " + types[types.length - 1] : "");
    li.appendChild(h1);

    li.appendChild(groupTable);
    tablesDiv.appendChild(li);
}

async function init() {
    tablesDiv = document.getElementById("tables");

    tablesDiv.innerHTML = "";

    await buildHeader();
    await getData();

    eggGroups.forEach(eggGroup => {
        setTable(eggGroup);
    });
}

init().then();
