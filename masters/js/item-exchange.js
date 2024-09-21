let exchangeList;
let exchangeInfos;

let banner;
let itemSet;
let itemExchange, itemExchangeGroup;
let progressEvent, progressEventRewardGroup;

let eventName;

async function getData() {
    await buildHeader();

    banner = await jsonCache.getProto("Banner");
    itemSet = await jsonCache.getProto("ItemSet");

    itemExchangeGroup = (await jsonCache.getProto("ItemExchangeGroup"))
        .reverse()
        .map(async ieg => {
            ieg.banner = banner.find(b => b.bannerId === ieg.bannerId);

            if (!ieg.banner)
                return ieg;

            ieg.banner.text1 = (await jsonCache.getLsd(`banner_text`))[ieg.banner.text1Id] || "";
            ieg.banner.text2 = (await jsonCache.getLsd(`banner_text`))[ieg.banner.text2Id] || "";
            return ieg;
        });

    itemExchange = await jsonCache.getProto("ItemExchange");
}

async function setEventInfos(exchangeId) {
    exchangeInfos.innerHTML = "";

    let exchange = itemExchange.filter(ie => ie.itemExchangeGroupId.toString() === exchangeId.toString());

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let nameTh = document.createElement("th");
    nameTh.innerText = "Objet";
    nameTh.colSpan = "1";

    let qtyTh = document.createElement("th");
    qtyTh.innerText = "Limite";

    let pointsTh = document.createElement("th");
    pointsTh.innerText = "Échange contre";

    tr.appendChild(nameTh);
    tr.appendChild(qtyTh);
    tr.appendChild(pointsTh);
    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    for(let i = 0; i < exchange.length; i++) {
        let is = itemSet.find(is => is.itemSetId === exchange[i].itemSetId);
        if(!is["item1"]) continue;

        let tr = document.createElement("tr");
        let imageTd = document.createElement("td");
        let image = document.createElement("img");
        //image.src("");
        imageTd.appendChild(image);

        let nameTd = document.createElement("td");
        nameTd.innerText = await getItemName(exchange[i].itemId) + ` (x${exchange[i].quantity})`;

        let qtyTd = document.createElement("td");
        qtyTd.innerText = exchange[i].limit === -1 ? "-" : exchange[i].limit;

        let pointsTd = document.createElement("td");
        pointsTd.innerText = await getItemName(is["item1"]) + ` x${is["item1Quantity"]}`;

        //tr.appendChild(imageTd);
        tr.appendChild(nameTd);
        tr.appendChild(qtyTd);
        tr.appendChild(pointsTd);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    exchangeInfos.appendChild(table);
}

async function getExchangeBipcodeTable() {
    const exchangeId = new URL(window.location).searchParams.get('exchangeId');
    if(exchangeId == null) return;

    let exchange = itemExchange.filter(ie => ie.itemExchangeGroupId.toString() === exchangeId.toString());

    let str = "[listh][item|nostyle][table]\n";
    str += "[tr][th|colspan=2]Objet[/th][th]Limite[/th][th]Échange contre[/th][/tr]\n";

    for(let i = 0; i < exchange.length; i++) {
        let is = itemSet.find(is => is.itemSetId === exchange[i].itemSetId);
        if(!is["item1"]) continue;

        str += "[tr]\n";
        str += `\t[td][img]/pages/jeuxvideo/pokemon-masters/images/item-2/${await getNormalizedItemName(exchange[i].itemId)}.png[/img][/td]\n`;
        str += `\t[td]${await getItemName(exchange[i].itemId)} (x${exchange[i].quantity})[/td]\n`;
        str += `\t[td]${exchange[i].limit === -1 ? "-" : exchange[i].limit}[/td]\n`;
        str += `\t[td]${await getItemName(is["item1"])} x${is["item1Quantity"]}[/td]\n`;
        str += "[/tr]\n";
    }

    str += "[/table][/item][/listh]";

    return str;
}

async function populateSelect() {
    for (let i = 0; i < itemExchangeGroup.length; i++) {

        if((await itemExchangeGroup[i]).banner == null) continue;

        let option = new Option((await itemExchangeGroup[i]).banner.text1.replace("\n", " "), (await itemExchangeGroup[i]).itemExchangeGroupId);
        exchangeList.appendChild(option);
    }

    exchangeList.addEventListener("change", selectChange);

    urlStateChange();
    window.addEventListener('popstate', urlStateChange);
}

function selectChange() {
    const url = new URL(window.location);
    url.searchParams.set('exchangeId', exchangeList.value);

    window.history.pushState(null, '', url.toString());

    setEventInfos(exchangeList.value).then();
}

function urlStateChange() {
    const url = new URL(window.location);
    const urlExchangeId = url.searchParams.get('exchangeId');

    if(urlExchangeId !== null) {
        exchangeList.value = urlExchangeId;
    }

    setEventInfos(exchangeList.value).then();
}

function setup() {
    exchangeList = document.getElementById("exchangeList");
    exchangeInfos = document.getElementById("exchangeInfosDiv");

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
