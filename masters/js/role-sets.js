let roleSetsDiv;

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

getData().then(() => {
    roleSetsDiv = document.getElementById("roleSetsDiv");

    let mainUl = document.createElement("ul");
    mainUl.classList.add("listh-bipcode");

    for(let set = 1;;set++) {
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

        let h1 = document.createElement("h1");
        h1.innerText = `SET ${set}`;
        h1.style.margin = "0";
        mainLi.appendChild(h1);

        for(let i = 0; i < setData.length; i++) {
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

        mainLi.appendChild(table);
        mainUl.appendChild(mainLi);
    }

    roleSetsDiv.appendChild(mainUl);
});
