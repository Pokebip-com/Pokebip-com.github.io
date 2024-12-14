let missionsList;
let missionsInfos;

async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("ItemSet");
    jsonCache.preloadProto("Mission");
    jsonCache.preloadProto("MissionGroup");

    // LSD
    jsonCache.preloadLsd("team_skill_tag");
    jsonCache.preloadLsd("mission_detail");
    jsonCache.preloadLsd("story_quest_name");

    // Locale
    jsonCache.preloadLocale("item-exchange");

    // Other Preloads
    preloadUtils(true);

    await jsonCache.runPreload();
}

function populateSelect() {
    for (let i = 0; i < jData.proto.itemExchangeGroup.length; i++) {

        if(jData.proto.itemExchangeGroup[i].banner == null) continue;

        let text = jData.proto.itemExchangeGroup[i].banner.text1 + (jData.proto.itemExchangeGroup[i].banner.text2 ? " - " + jData.proto.itemExchangeGroup[i].banner.text2 : "");

        let option = new Option(text.replace("\n", " "), jData.proto.itemExchangeGroup[i].itemExchangeGroupId);
        missionsList.appendChild(option);
    }

    missionsList.addEventListener("change", selectChange);

    urlStateChange();
    window.addEventListener('popstate', urlStateChange);
}

function selectChange() {
    const url = new URL(window.location);
    url.searchParams.set('exchangeId', missionsList.value);

    window.history.pushState(null, '', url.toString());

    setEventInfos(missionsList.value);
}

function urlStateChange() {
    const url = new URL(window.location);
    const urlExchangeId = url.searchParams.get('exchangeId');

    if(urlExchangeId !== null) {
        missionsList.value = urlExchangeId;
    }

    setEventInfos(missionsList.value);
}

function getItemsFromItemSets(itemSets) {

    let itemsList = "";

    for(let i = 0; i < itemSets.length; i++) {
        const is = jData.proto.itemSet.find(is => is.itemSetId === itemSets[i]);

        for(let j = 1; is[`item${j}`] && is[`item${j}`] !== "0"; j++) {
            if(is[`item${j}`] === "0") {
                break;
            }

            const name = getItemName(is[`item${j}`]);
            const quantity = is[`item${j}Quantity`];

            itemsList += `${name} (x${quantity})<br>`;
        }
    }

    return itemsList.replace(new RegExp("<br>$"), "");
}

function getMissionInfo(mission) {
    let text = jData.lsd.missionDetail[mission.requirementId]
        .replace(/\n/g, '<br>')
        .replace('[Digit:6digits Idx="2" ]', mission.objectives[0])
        .replace('[Name:QuestPlayType ]', "solo")
        .replace('[Digit:2digits Idx="1" ]', mission.parameters[0])
        .replace('[Name:QuestTitle ]', jData.lsd.storyQuestName[`quest_title_${mission.parameters[2]}`]);
    let element = jData.lsd.missionDetail[mission.requirementId + "_element"].replace("[Name:TeamSkillTag ]", jData.lsd.teamSkillTag[mission.parameters[1]]);


    return `${text}<br>${element}`;
}

function getBipcodeMissionGroupTable(missionGroupId) {
    let missionGroup = jData.proto.missionGroup.find(mg => mg.missionGroupId === missionGroupId);
    let missions = jData.proto.mission.filter(m => m.missionGroupId === missionGroupId);

    let tableStr = "[center][table]\n";
    tableStr += "\t[tr][th]N°[/th][th]Mission[/th][th]Récompense obtenue[/th][/tr]\n";

    for(let i = 0; i < missions.length; i++) {
        tableStr += `\t[tr][td]${missions[i].number}[/td][td]${getMissionInfo(missions[i])}[/td][td][img]/pages/jeuxvideo/pokemon-masters/images/item-2/certificat-excellence.png[/img][br]${getItemsFromItemSets(missions[i].itemSetIds)}[/td][/tr]\n`;
    }

    tableStr += `\t[tr][th|colspan=3]Après avoir fini 49 missions :[/th][/tr]\n`;
    tableStr += `\t[tr][td|colspan=3]${getItemsFromItemSets(...missionGroup.itemSetId)}[/td][/tr]\n`;
    tableStr += "[/tr][/table][/center]";

    return tableStr;
}

function setMissionGroupInfos(missionGroupId) {
    let missionGroup = jData.proto.missionGroup.find(mg => mg.missionGroupId === missionGroupId);
    let missions = jData.proto.mission.filter(m => m.missionGroupId === missionGroupId);

    let table = document.createElement("table");
    table.classList.add("bipcode");
    table.style.textAlign = "center";

    let thead = document.createElement("thead");

    let tr = document.createElement("tr");

    let numberTh = document.createElement("th");
    numberTh.innerText = "N°";
    tr.appendChild(numberTh);

    let missionTh = document.createElement("th");
    missionTh.innerText = "Mission";
    tr.appendChild(missionTh);

    let rewardTh = document.createElement("th");
    rewardTh.innerText = "Récompense obtenue";
    tr.appendChild(rewardTh);

    thead.appendChild(tr);

    let tbody = document.createElement("tbody");

    for(let i = 0; i < missions.length; i++) {
        let tr = document.createElement("tr");

        let numberTd = document.createElement("td");
        numberTd.innerText = missions[i].number;
        tr.appendChild(numberTd);

        let missionTd = document.createElement("td");
        missionTd.innerHTML = getMissionInfo(missions[i]);
        tr.appendChild(missionTd);

        let rewardTd = document.createElement("td");
        rewardTd.innerHTML = getItemsFromItemSets(missions[i].itemSetIds);
        tr.appendChild(rewardTd);

        tbody.appendChild(tr);
    }

    tr = document.createElement("tr");

    let allMissionsRewardTh = document.createElement("th");
    allMissionsRewardTh.colSpan = "3";
    allMissionsRewardTh.innerText = "Après avoir fini 49 missions :";
    tr.appendChild(allMissionsRewardTh);

    tbody.appendChild(tr);
    tr = document.createElement("tr");

    let allMissionsRewardTd = document.createElement("td");
    allMissionsRewardTd.colSpan = "3";
    allMissionsRewardTd.innerHTML = getItemsFromItemSets(...missionGroup.itemSetId);
    tr.appendChild(allMissionsRewardTd);

    tbody.appendChild(tr);

    table.appendChild(thead);
    table.appendChild(tbody);

    missionsInfos.appendChild(table);
}

function setup() {
    document.getElementById("pageTitle").innerText = jData.locale.common.adminsubmenu_itemExchange;
    missionsList = document.getElementById("missionsList");
    missionsInfos = document.getElementById("missionInfosDiv");

    if(isAdminMode) {
        document.getElementById("getBipcode").style.display = "block";

        document.getElementById("btnGetBipcode").addEventListener("click", (evt) => {
            let bipCode = getBipcodeMissionGroupTable(2610020).replaceAll("<br>", "[br]");
            navigator.clipboard.writeText(bipCode);
            evt.target.innerText = "Tableau copié dans le presse-papier";

            setTimeout(() => evt.target.innerText = "Copier le code du tableau", 5000);
        });
    }

    setMissionGroupInfos(2610020);

    //populateSelect();
}

getData().then(() => setup());
