let roleSetsDiv;
let toolboxDiv;
let mainUl;

let brRoleBonusSet;

async function getData() {
    const [
        brRoleBonusSetResponse,

    ] = await Promise.all([
        fetch("../data/proto/BattleRallyRoleBonusSet.json"),
    ])
        .catch(error => console.log(error));

    const brRoleBonusSetJSON = await brRoleBonusSetResponse.json();
    brRoleBonusSet = brRoleBonusSetJSON.entries;
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
    label.innerText = `Étage ${rowNum}`;

    let inputA = createSelectInput();
    inputA.id = `toolRow_${rowNum}_A`;

    let inputB = createSelectInput();
    inputB.id = `toolRow_${rowNum}_B`;

    let eraseBtn = document.createElement("button");
    eraseBtn.innerText = "Effacer";
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

    appendSelectRow(1);

    setMainUL();
});

function setMainUL() {
    mainUl.innerHTML = "";

    for(let set = 1;;set++) {
        let isSetVisible = true;

        let setData = brRoleBonusSet.filter(brrbs => brrbs.setId === set);

        if(setData.length === 0) {
            break;
        }

        setData.sort(sd => sd.floor);

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

            if(inputA && inputB && (
                (role_name_standard.includes(inputA.value) && inputA.value !== role_name_standard[setData[i].roleA])
                || (role_name_standard.includes(inputB.value) && inputB.value !== role_name_standard[setData[i].roleB])
            )) {
                isSetVisible = false;
                break;
            }

            let tr = document.createElement("tr");

            let floor = document.createElement("td");
            floor.innerHTML = `<b>Étage ${setData[i].floor}</b>`;
            tr.appendChild(floor);

            let roleA = document.createElement("td");
            roleA.innerText = `${role_name_standard[setData[i].roleA]}`;
            tr.appendChild(roleA);

            let roleB = document.createElement("td");
            roleB.innerText = `${role_name_standard[setData[i].roleB]}`;
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
