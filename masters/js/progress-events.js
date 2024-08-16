let eventsList;
let eventInfos;

let banner;
let itemSet;
let progressEvent, progressEventRewardGroup;

let eventName;

async function getData() {
    await buildHeader();

    banner = await jsonCache.getProto("Banner");
    itemSet = await jsonCache.getProto("ItemSet");
    progressEvent = (await jsonCache.getProto("ProgressEvent")).reverse();
    progressEventRewardGroup = await jsonCache.getProto("ProgressEventRewardGroup");

    let eventQuestGroupBanners = (await jsonCache.getProto("EventQuestGroup"))
        .filter(
            entry => progressEvent
                .map(pe => pe.questGroupId).includes(entry.questGroupId)
        )
        .map(entry => entry.bannerId);

    banner = banner.filter(b => eventQuestGroupBanners.includes(b.bannerId));
    eventName = Object.fromEntries(
        Object.entries(await jsonCache.getLsd("event_name"))
            .filter(([k, _]) => progressEvent.map(pe => pe.eventName).includes(k)
        )
    );
}

async function setEventInfos(eventId) {
    eventInfos.innerHTML = "";

    let rewardGroup = progressEventRewardGroup
        .filter(pe => pe.progressEventId === eventId)
        .sort((pe1, pe2) => pe1.rewardStep - pe2.rewardStep);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let nameTh = document.createElement("th");
    nameTh.innerText = "Objet";
    nameTh.colSpan = "2";

    let qtyTh = document.createElement("th");
    qtyTh.innerText = "Quantité";

    let pointsTh = document.createElement("th");
    pointsTh.innerText = "Points";

    tr.appendChild(nameTh);
    tr.appendChild(qtyTh);
    tr.appendChild(pointsTh);
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    for(let i = 0; i < rewardGroup.length; i++) {
        let is = itemSet.find(is => is.itemSetId === rewardGroup[i].itemSetId);
        if(!is["item1"]) continue;

        let tr = document.createElement("tr");
        let imageTd = document.createElement("td");
        let image = document.createElement("img");
        //image.src("");
        imageTd.appendChild(image);

        let nameTd = document.createElement("td");
        nameTd.innerText = await getItemName(is["item1"]);

        let qtyTd = document.createElement("td");
        qtyTd.innerText = is["item1Quantity"];

        let pointsTd = document.createElement("td");
        pointsTd.innerText = rewardGroup[i].repeatedStep === "true" ? `Tous les ${rewardGroup[i].step}` : rewardGroup[i].step;

        tr.appendChild(imageTd);
        tr.appendChild(nameTd);
        tr.appendChild(qtyTd);
        tr.appendChild(pointsTd);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    eventInfos.appendChild(table);
}

async function getEventBipcodeTable() {
    const eventId = new URL(window.location).searchParams.get('eventId');
    if(eventId == null) return;

    let rewardGroup = progressEventRewardGroup
        .filter(pe => pe.progressEventId === eventId)
        .sort((pe1, pe2) => pe1.rewardStep - pe2.rewardStep);

    let str = "[listh][item|nostyle][table]\n";
    str += "[tr][th|colspan=2]Objet[/th][th]Quantité[/th][th]Points totaux requis[/th][/tr]\n";

    for(let i = 0; i < rewardGroup.length; i++) {
        let is = itemSet.find(is => is.itemSetId === rewardGroup[i].itemSetId);
        if(!is["item1"]) continue;

        str += "[tr]\n";
        str += `\t[td][img]/pages/jeuxvideo/pokemon-masters/images/item-2/${await getNormalizedItemName(is["item1"])}.png[/img][/td]\n`;
        str += `\t[td]${await getItemName(is["item1"])}[/td]\n`;
        str += `\t[td]${is["item1Quantity"]}[/td]\n`;
        str += `\t[td]${rewardGroup[i].repeatedStep === "true" ? `Tous les ${rewardGroup[i].step} pts[br](au-delà de ${rewardGroup[i-1].step} pts)` : rewardGroup[i].step}[/td]\n`;
        str += "[/tr]\n";
    }

    str += "[/table][/item][/listh]";

    return str;
}

function populateSelect() {
    for(let i = 0; i < progressEvent.length; i++) {

        let option = new Option(eventName[progressEvent[i].eventName], progressEvent[i].progressEventId)
        eventsList.appendChild(option);
    }

    eventsList.addEventListener("change", selectChange);

    urlStateChange();
    window.addEventListener('popstate', urlStateChange);
}

function selectChange() {
    const url = new URL(window.location);
    url.searchParams.set('eventId', eventsList.value);

    window.history.pushState(null, '', url.toString());

    setEventInfos(eventsList.value).then();
}

function urlStateChange() {
    const url = new URL(window.location);
    const urlEventId = url.searchParams.get('eventId');

    if(urlEventId !== null) {
        eventsList.value = urlEventId;
    }

    setEventInfos(eventsList.value).then();
}

function setup() {
    eventsList = document.getElementById("eventsList");
    eventInfos = document.getElementById("eventInfosDiv");

    if(isAdminMode) {
        document.getElementById("getBipcode").style.display = "block";

        document.getElementById("btnGetBipcode").addEventListener("click", (evt) => {
            getEventBipcodeTable().then(bipCode => {
                navigator.clipboard.writeText(bipCode);
                evt.target.innerText = "Tableau copié dans le presse-papier";

                setTimeout(() => evt.target.innerText = "Copier le code du tableau", 5000);
            });
        });
    }

    populateSelect();
}

getData().then(() => setup());
