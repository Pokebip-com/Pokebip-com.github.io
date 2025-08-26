let roleSetsDiv;
let toolboxDiv;
let mainUl;

async function getData() {
    await buildHeader("..");

    // PROTO
    jsonCache.preloadProto("BattleRallyRoleBonusSet");

    // Locale
    jsonCache.preloadLocale("role-set");

    await jsonCache.runPreload();
}

function createSelectInput() {
    let input = document.createElement("input");
    input.type = "search";
    input.setAttribute("list", "roles-list");
    input.addEventListener("input", () => setMainUL());

    return input;
}

function addRemoveBtnToRow(rowNum) {
    let removeRowBtn = document.createElement("button");
    removeRowBtn.id = "removeRowBtn";
    removeRowBtn.innerText = "-";

    removeRowBtn.addEventListener("click", () => {
        let removeRow = document.getElementById(`toolRow_${rowNum}`);
        removeRow.remove();

        addCreateBtnToRow(rowNum - 1);

        if(rowNum > 2) {
            addRemoveBtnToRow(rowNum - 1);
        }

        setMainUL();
    });

    document.getElementById(`addRemBtn_${rowNum}`).appendChild(removeRowBtn);
}

function addCreateBtnToRow(rowNum) {
    let div = document.getElementById(`addRemBtn_${rowNum}`);

    let createRowBtn = document.createElement("button");
    createRowBtn.id = "createRowBtn";
    createRowBtn.innerText = "+";

    createRowBtn.addEventListener("click", () => {
        if(rowNum > 1) {
            document.getElementById("removeRowBtn").remove();
        }
        appendSelectRow(rowNum + 1);
    });

    div.appendChild(createRowBtn);
}

function appendSelectRow(rowNum) {
    let row = document.createElement("p");
    row.id = `toolRow_${rowNum}`;

    let label = document.createElement("label");
    label.setAttribute("for", `toolRow_${rowNum}_A`);
    label.style.fontWeight = "700";
    label.innerText = `${jData.locale.roleSet.floor} ${rowNum}`;

    let inputA = createSelectInput();
    inputA.id = `toolRow_${rowNum}_A`;

    let inputB = createSelectInput();
    inputB.id = `toolRow_${rowNum}_B`;

    let eraseBtn = document.createElement("button");
    eraseBtn.innerText = jData.locale.roleSet.reset;
    eraseBtn.addEventListener("click", () => {
        inputA.value = "";
        inputB.value = "";
        setMainUL();
    });

    let addRemoveBtnDiv = document.createElement("div");
    addRemoveBtnDiv.id = `addRemBtn_${rowNum}`;
    addRemoveBtnDiv.style.width = "45px";

    row.appendChild(label);
    row.appendChild(eraseBtn);
    row.appendChild(inputA);
    row.appendChild(inputB);
    row.appendChild(addRemoveBtnDiv);
    toolboxDiv.appendChild(row);

    if(rowNum < 3)
        addCreateBtnToRow(rowNum);

    if(rowNum > 1) {
        document.getElementById("createRowBtn").remove();
        addRemoveBtnToRow(rowNum);
    }
}

getData().then(() => {
    roleSetsDiv = document.getElementById("roleSetsDiv");
    toolboxDiv = document.getElementById("toolbox");
    mainUl = document.getElementById("mainUL");

    document.getElementById("pageTitle").innerText = `${jData.locale.common.menu_battle_rally} > ${jData.locale.common.submenu_rally_role_set}`;
    document.getElementById("fieldsetLegend").innerText = jData.locale.roleSet.filters;

    let dataList = document.createElement("datalist");
    dataList.id = "roles-list";

    for(let i = 1; i < Object.keys(jData.locale.common.role_name_standard).length; i++) {
        let option = document.createElement("option");
        option.value = jData.locale.common.role_name_standard[i];
        dataList.appendChild(option);
    }

    document.getElementById("contentDiv").appendChild(dataList);

    appendSelectRow(1);

    setMainUL();
});

function setMainUL() {
    mainUl.innerHTML = "";

    for(let set = 1;;set++) {
        let isSetVisible = true;

        let setData = jData.proto.battleRallyRoleBonusSet.filter(brrbs => brrbs.setId === set);

        if(setData.length === 0) {
            break;
        }

        setData.sort((a, b) => {
            if(a.floor < b.floor)
                return -1;
            if(a.floor > b.floor)
                return 1;
            return 0;
        });

        let mainLi = document.createElement("li");
        mainLi.classList.add("listh-no-style");
        mainLi.style.width = "270px";
        mainLi.style.textAlign = "left";

        let table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.width = "100%";

        for(let i = 0; i < setData.length; i++) {
            let inputA = document.getElementById(`toolRow_${i+1}_A`);
            let inputB = document.getElementById(`toolRow_${i+1}_B`);
            let values = Object.values(jData.locale.common.role_name_standard);

            if(inputA && inputB && (
                (values.includes(inputA.value) && inputA.value !== jData.locale.common.role_name_standard[setData[i].roleA])
                || (values.includes(inputB.value) && inputB.value !== jData.locale.common.role_name_standard[setData[i].roleB])
            )) {
                isSetVisible = false;
                break;
            }

            let tr = document.createElement("tr");

            let floor = document.createElement("td");
            floor.innerHTML = `<b>${jData.locale.roleSet.floor} ${setData[i].floor}</b>`;
            tr.appendChild(floor);

            let roleA = document.createElement("td");
            roleA.innerText = jData.locale.common.role_name_standard[setData[i].roleA];
            tr.appendChild(roleA);

            let roleB = document.createElement("td");
            roleB.innerText = jData.locale.common.role_name_standard[setData[i].roleB];
            tr.appendChild(roleB);

            table.appendChild(tr);
        }

        if(!isSetVisible) {
            continue;
        }

        let h1 = document.createElement("h1");
        h1.innerText = `SET ${set}`;
        h1.style.margin = "0";
        mainLi.appendChild(h1);

        mainLi.appendChild(table);
        mainUl.appendChild(mainLi);
    }
}
