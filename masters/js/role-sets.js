let roleSetsDiv;

let brRoleBonusSet;
let roleTypeName;

async function getData() {
    const [
        brRoleBonusSetResponse,
        roleTypeNameResponse

    ] = await Promise.all([
        fetch("../data/proto/BattleRallyRoleBonusSet.json"),
        fetch("../data/lsd/role_type_name_fr.json")
    ])
        .catch(error => console.log(error));

    const brRoleBonusSetJSON = await brRoleBonusSetResponse.json();
    brRoleBonusSet = brRoleBonusSetJSON.entries;

    roleTypeName = await roleTypeNameResponse.json();
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
            roleSetsDiv.innerHTML += `\n<li><b>Étage ${setData[i].floor} :</b> ${roleTypeName[setData[i].roleA]} + ${roleTypeName[setData[i].roleB]}</li>`;
        }

        roleSetsDiv.innerHTML += `\n</ul>\n`;

    }
});
