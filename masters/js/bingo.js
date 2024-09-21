let bingoList;
let bingoMission, bingoReward;

let banner;
let itemSet;

let bingoMissionGroup, bingoMissionReward, bingoMissionCard;

let itemExchange, itemExchangeGroup;

async function getData() {
    await buildHeader();

    banner = await jsonCache.getProto("Banner");
    itemSet = await jsonCache.getProto("ItemSet");

    bingoMissionGroup = await jsonCache.getProto("BingoMissionGroup")
        .then(bmg => {
            bmg.sort((a, b) => b.bingoMissionCardId - a.bingoMissionCardId);
            return Promise.all(bmg.map(async mg => {
                mg.banner = banner.find(b => b.bannerId === mg.bannerId);

                if (!mg.banner)
                    return mg;

                mg.banner.text1 = (await jsonCache.getLsd(`banner_text`))[mg.banner.text1Id] || "";
                mg.banner.text2 = (await jsonCache.getLsd(`banner_text`))[mg.banner.text2Id] || "";
                return mg;
            }))
        });

    bingoMissionReward = await jsonCache.getProto("BingoMissionReward");
    bingoMissionCard = await jsonCache.getProto("BingoMissionCard");
}

function appendMission(td, mission) {
    //TODO: Afficher le texte des missions
}

async function appendReward(td, mission) {
    for (let i = 0; i < mission.itemSetIds.length; i++) {
        let is = itemSet.find(is => is.itemSetId === mission.itemSetIds[i]);
        if (!is) continue;

        for(let j = 1; j <= 10; j++) {
            if(is["item" + j] === "0")
                continue;

            if(j > 1)
                td.innerText += "\n";

            td.innerText += `${await getItemName(is["item" + j])} (x${is["item" + j + "Quantity"]})\n`;
        }
    }
}

async function createBingoCard(bingoId) {

    bingoMission.innerHTML = "";

    const missionGroup = bingoMissionGroup.find(bmg => bmg.bingoMissionGroupId.toString() === bingoId.toString());

    const missionCard = await jsonCache.getProto("BingoMissionCard").then(bmc => {
        bmc = bmc.filter(bm => bm.bingoMissionCardId.toString() === missionGroup.bingoMissionCardId.toString())
            .sort((a, b) => a.number - b.number);

        return Promise.all(bmc.map(async bm => {
            bm.mission = (await jsonCache.getProto("Mission"))
                .find(m => m.missionId.toString() === bm.missionId.toString());
            return bm;
        }));
    });

    // Taille d'une ligne/colonne de bingo
    const sqrSize = Math.sqrt(missionCard.length);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let th = document.createElement("th");
    th.innerText = " ";
    tr.appendChild(th);

    for(let i = 0; i < sqrSize; i++) {
        let th = document.createElement("th");
        th.innerText = i+1;
        tr.appendChild(th);
    }

    thead.appendChild(tr);

    let tbody = document.createElement("tbody");

    for(let i = 0; i < sqrSize; i++) {
        let tr = document.createElement("tr");
        let th = document.createElement("th");
        th.rowSpan = 1;
        th.innerText = i+1;
        tr.appendChild(th);

        for(let j = 0; j < sqrSize; j++) {
            let td = document.createElement("td");
            appendMission(td, missionCard[i*sqrSize + j].mission);
            //tr.appendChild(td);
        }

        tbody.appendChild(tr);

        //tr = document.createElement("tr");

        for(let j = 0; j < sqrSize; j++) {
            let td = document.createElement("td");
            await appendReward(td, missionCard[i * sqrSize + j].mission);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    bingoMission.appendChild(table);

}

async function createBingoRewards(bingoId) {

    bingoReward.innerHTML = "";

    const missionGroup = bingoMissionGroup.find(bmg => bmg.bingoMissionGroupId.toString() === bingoId.toString());

    const missionReward = await jsonCache.getProto("BingoMissionReward").then(bmr => {
        bmr = bmr.filter(bm => bm.bingoMissionRewardId.toString() === missionGroup.bingoMissionRewardId.toString())
            .sort((a, b) => a.nbLines - b.nbLines);

        return Promise.all(bmr.map(async bm => {
            bm.itemSet = (await jsonCache.getProto("ItemSet"))
                .find(is => is.itemSetId.toString() === bm.itemSetId.toString());
            return bm;
        }));
    });

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let linesTh = document.createElement("th");
    linesTh.innerText = "Lignes";
    tr.appendChild(linesTh);

    let rewardsTh = document.createElement("th");
    rewardsTh.innerText = "Récompenses";
    tr.appendChild(rewardsTh);

    thead.appendChild(tr);

    let tbody = document.createElement("tbody");

    for(let i = 1; i <= missionReward.length; i++) {
        let tr = document.createElement("tr");
        let linesTh = document.createElement("th");

        let nbLines = missionReward[i%missionReward.length].nbLines;

        linesTh.innerText = nbLines === 0 ? "Grille complète" : nbLines;

        tr.appendChild(linesTh);

        let rewardsTd = document.createElement("td");
        let is = missionReward[i%missionReward.length].itemSet;
        if (!is) continue;

        for(let j = 1; j <= 10; j++) {
            if(is["item" + j] === "0")
                continue;

            if(j > 1)
                rewardsTd.innerText += "\n";

            rewardsTd.innerText += `${await getItemName(is["item" + j])} (x${is["item" + j + "Quantity"]})\n`;
        }

        tr.appendChild(rewardsTd);

        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    bingoReward.appendChild(table);

}

async function setEventInfos(bingoId) {

    await createBingoCard(bingoId);
    await createBingoRewards(bingoId);
}

async function getExchangeBipcodeTable() {
    const bingoId = new URL(window.location).searchParams.get('bingoId');
    if(bingoId == null) return;

    let exchange = itemExchange.filter(ie => ie.itemExchangeGroupId.toString() === bingoId.toString());

    let str = "[listh][item|nostyle][table]\n";
    str += "[tr][th|colspan=2]Objet[/th][th]Limite[/th][th]Échange contre[/th][/tr]\n";

    for(let i = 0; i < exchange.length; i++) {
        let is = itemSet.find(is => is.itemSetId === exchange[i].itemSetId);
        if(!is["item1"]) continue;

        str += "[tr]\n";
        str += `\t[td][img]/pages/jeuxvideo/pokemon-masters/images/item-2/${await getNormalizedItemName(exchange[i].itemId)}.png[/img][/td]\n`;
        str += `\t[td]${await getItemName(exchange[i].itemId)} x${exchange[i].quantity}[/td]\n`;
        str += `\t[td]${exchange[i].limit === -1 ? "-" : exchange[i].limit}[/td]\n`;
        str += `\t[td]${await getItemName(is["item1"])} x${is["item1Quantity"]}[/td]\n`;
        str += "[/tr]\n";
    }

    str += "[/table][/item][/listh]";

    return str;
}

async function populateSelect() {
    for (let i = 0; i < bingoMissionGroup.length; i++) {

        if(bingoMissionGroup[i].banner == null) continue;

        let text1 = bingoMissionGroup[i].banner.text1;
        let text2 = bingoMissionGroup[i].banner.text2;

        let text = `${text1} ${text2}`;
        if(text1 === "") text = text2;
        else if (text2 === "") text = text1;

        let option = new Option(text.replace("\n", " "), bingoMissionGroup[i].bingoMissionGroupId);
        bingoList.appendChild(option);
    }

    bingoList.addEventListener("change", selectChange);

    urlStateChange();
    window.addEventListener('popstate', urlStateChange);
}

function selectChange() {
    const url = new URL(window.location);
    url.searchParams.set('bingoId', bingoList.value);

    window.history.pushState(null, '', url.toString());

    setEventInfos(bingoList.value).then();
}

function urlStateChange() {
    const url = new URL(window.location);
    const urlBingoId = url.searchParams.get('bingoId');

    if(urlBingoId !== null) {
        bingoList.value = urlBingoId;
    }

    setEventInfos(bingoList.value).then();
}

function setup() {
    bingoList = document.getElementById("bingoList");
    bingoMission = document.getElementById("bingoMissionDiv");
    bingoReward = document.getElementById("bingoRewardDiv");

    if (isAdminMode) {
        document.getElementById("getBipcode").style.display = "block";

        document.getElementById("btnGetBipcode").addEventListener("click", (evt) => {
            getExchangeBipcodeTable().then(bipCode => {
                navigator.clipboard.writeText(bipCode);
                evt.target.innerText = "Tableau copié dans le presse-papier";

                setTimeout(() => evt.target.innerText = "Copier le code du tableau", 5000);
            });
        });
    }

    populateSelect();
}

getData().then(() => setup());
