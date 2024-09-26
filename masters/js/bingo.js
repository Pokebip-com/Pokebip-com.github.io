let bingoList;
let bingoMission, bingoReward;

async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("BingoMissionCard");
    jsonCache.preloadProto("BingoMissionGroup");
    jsonCache.preloadProto("BingoMissionReward");
    jsonCache.preloadProto("ItemSet");
    jsonCache.preloadProto("Mission");

    // LSD
    jsonCache.preloadLsd("banner_text");

    // Other Preloads
    preloadUtils(true);

    await jsonCache.runPreload();

    jData.proto.bingoMissionGroup = jData.proto.bingoMissionGroup
        .map(mg => {
            mg.banner = jData.proto.banner.find(b => b.bannerId === mg.bannerId);

            if(!mg.banner)
                return mg;

            mg.banner.text1 = jData.lsd.bannerText[mg.banner.text1Id] || "";
            mg.banner.text2 = jData.lsd.bannerText[mg.banner.text2Id] || "";

            return mg;
        })
        .sort((a, b) => b.bingoMissionCardId - a.bingoMissionCardId);
}

function appendMission(td, mission) {
    //TODO: Afficher le texte des missions
}

function appendReward(td, mission) {
    for (let i = 0; i < mission.itemSetIds.length; i++) {
        let is = jData.proto.itemSet.find(is => is.itemSetId === mission.itemSetIds[i]);
        if (!is) continue;

        for(let j = 1; j <= 10; j++) {
            if(is["item" + j] === "0")
                continue;

            if(j > 1)
                td.innerHTML += "<br>";

            td.innerHTML += `${getItemName(is["item" + j])} (x${is["item" + j + "Quantity"]})\n`;
        }
    }
}

function createBingoCard(bingoId) {

    bingoMission.innerHTML = "";

    const missionGroup = jData.proto.bingoMissionGroup.find(bmg => bmg.bingoMissionGroupId.toString() === bingoId.toString());

    const missionCard = jData.proto.bingoMissionCard
        .filter(bm => bm.bingoMissionCardId.toString() === missionGroup.bingoMissionCardId.toString())
        .sort((a, b) => a.number - b.number)
        .map(bm => {
            bm.mission = jData.proto.mission.find(m => m.missionId.toString() === bm.missionId.toString());
            return bm;
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
            appendReward(td, missionCard[i * sqrSize + j].mission);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    bingoMission.appendChild(table);

}

function createBingoRewards(bingoId) {

    bingoReward.innerHTML = "";

    const missionGroup = jData.proto.bingoMissionGroup.find(bmg => bmg.bingoMissionGroupId.toString() === bingoId.toString());

    const missionReward = jData.proto.bingoMissionReward
        .filter(bmr => bmr.bingoMissionRewardId.toString() === missionGroup.bingoMissionRewardId.toString())
        .sort((a, b) => a.nbLines - b.nbLines)
        .map(bm => {
            bm.itemSet = jData.proto.itemSet.find(is => is.itemSetId.toString() === bm.itemSetId.toString());
            return bm;
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
                rewardsTd.innerHTML += "<br>";

            rewardsTd.innerHTML += `${getItemName(is["item" + j])} (x${is["item" + j + "Quantity"]})\n`;
        }

        tr.appendChild(rewardsTd);

        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    bingoReward.appendChild(table);

}

function setEventInfos(bingoId) {

    createBingoCard(bingoId);
    createBingoRewards(bingoId);
}

function getExchangeBipcodeTable() {
    const bingoId = new URL(window.location).searchParams.get('bingoId');
    if(bingoId == null) return;

    let exchange = jData.proto.itemExchange.filter(ie => ie.itemExchangeGroupId.toString() === bingoId.toString());

    let str = "[listh][item|nostyle][table]\n";
    str += "[tr][th|colspan=2]Objet[/th][th]Limite[/th][th]Échange contre[/th][/tr]\n";

    for(let i = 0; i < exchange.length; i++) {
        let is = jData.proto.itemSet.find(is => is.itemSetId === exchange[i].itemSetId);
        if(!is["item1"]) continue;

        str += "[tr]\n";
        str += `\t[td][img]/pages/jeuxvideo/pokemon-masters/images/item-2/${getNormalizedItemName(exchange[i].itemId)}.png[/img][/td]\n`;
        str += `\t[td]${getItemName(exchange[i].itemId)} x${exchange[i].quantity}[/td]\n`;
        str += `\t[td]${exchange[i].limit === -1 ? "-" : exchange[i].limit}[/td]\n`;
        str += `\t[td]${getItemName(is["item1"])} x${is["item1Quantity"]}[/td]\n`;
        str += "[/tr]\n";
    }

    str += "[/table][/item][/listh]";

    return str;
}

function populateSelect() {
    for (let i = 0; i < jData.proto.bingoMissionGroup.length; i++) {

        if(jData.proto.bingoMissionGroup[i].banner == null) continue;

        let text1 = jData.proto.bingoMissionGroup[i].banner.text1;
        let text2 = jData.proto.bingoMissionGroup[i].banner.text2;

        let text = `${text1} ${text2}`;
        if(text1 === "") text = text2;
        else if (text2 === "") text = text1;

        let option = new Option(text.replace("\n", " "), jData.proto.bingoMissionGroup[i].bingoMissionGroupId);
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

    setEventInfos(bingoList.value);
}

function urlStateChange() {
    const url = new URL(window.location);
    const urlBingoId = url.searchParams.get('bingoId');

    if(urlBingoId !== null) {
        bingoList.value = urlBingoId;
    }

    setEventInfos(bingoList.value);
}

function setup() {
    document.getElementById("pageTitle").innerText = jData.locale.common.adminsubmenu_bingo;
    bingoList = document.getElementById("bingoList");
    bingoMission = document.getElementById("bingoMissionDiv");
    bingoReward = document.getElementById("bingoRewardDiv");

    populateSelect();
}

getData().then(() => setup());
