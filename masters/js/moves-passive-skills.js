function preloadMovePassiveSkills() {
    // PROTO
    jsonCache.preloadProto("Move");
    jsonCache.preloadProto("MoveAndPassiveSkillDigit");
    jsonCache.preloadProto("PassiveSkillChild");

    // LSD
    jsonCache.preloadLsd("move_description");
    jsonCache.preloadLsd("move_description_parts");
    jsonCache.preloadLsd("move_name");
    jsonCache.preloadLsd("move_target_type");
    jsonCache.preloadLsd("passive_skill_and_move_number");
    jsonCache.preloadLsd("passive_skill_description");
    jsonCache.preloadLsd("passive_skill_description_parts");
    jsonCache.preloadLsd("passive_skill_name");
    jsonCache.preloadLsd("passive_skill_name_parts");
    jsonCache.preloadLsd("tag_name_with_prepositions");
}

function getMoveDescr(id) {
    let descr = jData.lsd.moveDescription[id];

    const descrPartsRE = /\[Name:MoveDescriptionPartsIdTag Idx="(\w+)" ]/i;
    let idx = descrPartsRE.exec(descr);


    if(idx !== null) {
        do {
            descr = descr.replace(descrPartsRE, jData.lsd.moveDescriptionParts[idx[1]]);
            descrPartsRE.lastIndex = 0;
        } while((idx = descrPartsRE.exec(descr)) !== null);
    }

    if(descr !== undefined)
        descr = setParams(id, descr);

    return descr.replace("]", "");
}

function getPassiveSkillName(id) {
    let name = jData.lsd.passiveSkillName[id];
    const namePartsRE = /\[Name:PassiveSkillNameParts Idx="(\w+)" \]/i;
    let idx = namePartsRE.exec(name);

    if(idx !== null) {
         do {
             name = name.replace(namePartsRE, jData.lsd.passiveSkillNameParts[idx[1]]);
             name = name.replace(/\[Name:PassiveSkillNameDigit \]/i, (parseInt(id) - parseInt(idx[1])) + "");
             namePartsRE.lastIndex = 0;
         } while((idx = namePartsRE.exec(name)) !== null);
    }

    if(name !== undefined)
        name = setParams(id, name);

    return name;
}

function getDetailedPassiveSkillName(id) {
    let children = jData.proto.passiveSkillChild.find(psc => psc.passiveSkillId === id);
    let name = getPassiveSkillName(id);

    if(!children)
        return name;

    let childrenNames = children.passiveSkillChildIds.map(pc => getPassiveSkillName(pc)).join("<br>");

    let container = document.createElement("span");
    container.classList.add("custom-tooltip-container");

    let trigger = document.createElement("span");
    trigger.classList.add("custom-tooltip-trigger");
    trigger.innerHTML = name;
    container.appendChild(trigger);

    let tooltip = document.createElement("span");
    tooltip.classList.add("custom-tooltip-text");
    tooltip.innerHTML = childrenNames;
    container.appendChild(tooltip);

    return container.outerHTML;

}

function getPassiveSkillDescr(id) {
    let descr = jData.lsd.passiveSkillDescription[id];
    const descrPartsRE = /\[Name:PassiveSkillDescriptionPartsIdTag Idx="(\w+)" ]/i;
    let idx = descrPartsRE.exec(descr);

    if(idx !== null) {
        do {
            descr = descr.replace(descrPartsRE, jData.lsd.passiveSkillDescriptionParts[idx[1]]);
            descrPartsRE.lastIndex = 0;
        } while((idx = descrPartsRE.exec(descr)) !== null);
    }

    if(descr !== undefined)
        descr = setParams(id, descr);

    return descr;
}

function setParams(id, descr) {

    // Types = [ "Digit", "FR", "Name" ]
    // SubTypes = [ "2digits", "Qty", "ReferencedMessageTag", "1digit", "PassiveSkillId", "MoveId" ]
    // Digit: 1digit + 2digits / FR: Qty / Name: ReferencedMessageTag + MoveId + PassiveSkillId
    // Params = [ "S", "P", "Idx", "Ref" ]

    let paramArray = getParamArray(id);
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
            .reduce((acc, curr) => Object.assign(acc, curr), { "Idx" : 0, "Ref" : 0 });

        let replaceValue = "";

        switch(type) {
            case "Digit":
                replaceValue = jData.lsd.passiveSkillAndMoveNumber[paramArray[params.Idx]];
                break;

            case "Name":
                switch(subtype) {
                    case "ReferencedMessageTag":
                        replaceValue = jData.lsd.tagNameWithPrepositions[paramArray[params.Idx]];
                        break;

                    case "MoveId":
                        replaceValue = jData.lsd.moveName[params.Idx];
                        break;

                    case "PassiveSkillId":
                        replaceValue = getPassiveSkillName(params.Idx);
                        break;
                }
                break;

            case "EN":
            case "FR":
                replaceValue = (paramArray[params.Ref] > 1 ? params.P : params.S);
                break;
        }

        descr = descr.replace(bracketValues[i], replaceValue);
    }


    return descr;
}

function getParamArray(id) {
    let values = jData.proto.moveAndPassiveSkillDigit.find(mapsd => mapsd.id === id.toString());
    let paramArray = [];

    if(!values) {
        return paramArray;
    }

    for(let i = 1; i < 20; i += 2) {
        let type = parseInt(values[`param${i}`]);

        if(type >= 0) {
            let value = values[`param${i+1}`];
            paramArray.push(value);
        }
        else
            paramArray.push(null);
    }

    return paramArray;
}

function createPassiveTable() {
    let passiveSkillsDiv = document.getElementById("passiveSkillsDiv");

    let table = document.createElement("table");
    let firstRow = document.createElement("tr");
    let nameTitle = document.createElement("th");
    let descrTitle = document.createElement("th");

    nameTitle.innerText = "Nom";
    descrTitle.innerText = "Description";

    firstRow.appendChild(nameTitle);
    firstRow.appendChild(descrTitle);
    table.appendChild(firstRow);
    passiveSkillsDiv.appendChild(table);

    Object.keys(jData.lsd.passiveSkillDescription).forEach(key => {
        let row = document.createElement("tr");

        let nameCell = document.createElement("td");
        nameCell.innerText = getPassiveSkillName(key);
        row.appendChild(nameCell);

        let descriptionCell = document.createElement("td");
        descriptionCell.innerText = getPassiveSkillDescr(key);

        row.appendChild(descriptionCell);

        table.appendChild(row);
    });

    let moveDiv = document.getElementById("movesDiv");

    table = document.createElement("table");
    firstRow = document.createElement("tr");
    nameTitle = document.createElement("th");
    descrTitle = document.createElement("th");

    nameTitle.innerText = "Nom";
    descrTitle.innerText = "Description";

    firstRow.appendChild(nameTitle);
    firstRow.appendChild(descrTitle);
    table.appendChild(firstRow);
    moveDiv.appendChild(table);

    Object.keys(jData.lsd.moveDescription).forEach(key => {
        let row = document.createElement("tr");
        let nameCell = document.createElement("td");
        nameCell.innerText = jData.lsd.moveName[key];
        row.appendChild(nameCell);

        let descriptionCell = document.createElement("td");
        descriptionCell.innerText = getMoveDescr(key);
        row.appendChild(descriptionCell);

        table.appendChild(row);
    });
}
