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

    for(let set = 1;;set++) {
        let setData = brRoleBonusSet.filter(brrbs => brrbs.setId === set);

        if(setData.length === 0) {
            break;
        }

        setData.sort(sd => sd.floor);

        roleSetsDiv.innerHTML += `<h2>Set ${set}</h2>\n<ul>`;

        for(let i = 0; i < setData.length; i++) {
            roleSetsDiv.innerHTML += `\n<li><b>Étage ${setData[i].floor} :</b> ${role_name_standard[setData[i].roleA]} + ${role_name_standard[setData[i].roleB]}</li>`;
        }

        roleSetsDiv.innerHTML += `\n</ul>\n`;

    }
});
