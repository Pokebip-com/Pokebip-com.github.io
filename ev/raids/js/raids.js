const dataPath = "./data";
const eventsPath = dataPath + '/events';
const language = "French";
let eventsList;

let encData;
let priorityData;
let dropData;
let bonusDropData

let abilityNames;
let itemNames;
let moveNames;
let specieNames;
let tmNames;

let btnCopy;
let statsTable;
let raidTable;
let textarea;
let raidsListSelect;
let pokemonListSpan;

let zip = new JSZip();

async function getData() {
	const basePath = dataPath + '/' + language + '/';

	const [
		abilityNamesResponse,
		itemNamesResponse,
		moveNamesResponse,
		specieNamesResponse,
		tmNamesResponse
	] = await Promise.all([
		fetch(basePath + 'abilities.txt'),
		fetch(basePath + 'items.txt'),
		fetch(basePath + 'moves.txt'),
		fetch(basePath + 'species.txt'),
		fetch(basePath + 'tm.txt')
	])
		.catch(error => console.log(error));

	abilityNames = (await abilityNamesResponse.text()).split(/\r?\n/).filter(el => el);
	itemNames = (await itemNamesResponse.text()).split(/\r?\n/).filter(el => el);
	moveNames = (await moveNamesResponse.text()).split(/\r?\n/).filter(el => el);
	specieNames = (await specieNamesResponse.text()).split(/\r?\n/).filter(el => el);
	tmNames = (await tmNamesResponse.text()).split(/\r?\n/).filter(el => el);
}

async function getEventDirectories() {/*
	const response = await fetch('https://api.github.com/repos/pokebip-com/Pokebip-com.github.io/contents' + eventsPath);
	const dataDir = await response.json();*/

	dataDir = [
		{
			"name" : "2022.11.25-Evoli"
		},
		{
			"name" : "2022.12.02-Dracaufeu"
		}
	];

	dataDir.sort((a, b) => b.name.localeCompare(a.name))

	eventsList = [];

	for(let dir of dataDir) {
		eventsList.push(dir.name);
		raidsListSelect.add(new Option(dir.name, dir.name));
	}
}

async function getEventData(event) {
	const eventPath = eventsPath + '/' + event + '/';

	const [
		encDataResponse,
		priorityDataResponse,
		dropDataResponse,
		bonusDropDataResponse
	] = await Promise.all([
		fetch(eventPath + "enc.json"),
		fetch(eventPath + "priority.json"),
		fetch(eventPath + "drop.json"),
		fetch(eventPath + "bonus.json"),
	])
		.catch(error => console.log(error));

	encData = await encDataResponse.json();
	encData = encData.Table;

	priorityData = await priorityDataResponse.json();
	priorityData = priorityData.Table;

	dropData = await dropDataResponse.json();
	dropData = dropData.Table;

	bonusDropData = await bonusDropDataResponse.json();
	bonusDropData = bonusDropData.Table;
}

function setGrid(id) {
	raidTable.innerHTML = "";
	raidTable.innerHTML += "<tr><th>Amélioration</th><th>Effet</th><th>Énergie requise</th><th>Duo-Sphères requises</th><th>Niveau des Capacités requis</th></tr>\n";

	textarea.value = "[center][table]\n[tr][th|width=250px]Amélioration[/th][th|width=300px]Effet[/th][th|width=100px]Énergie requise[/th][th|width=100px]Duo-Sphères requises[/th][th|width=100px]Niveau des Capacités requis[/th][/tr]\n";

	appendCategory(abilityPanelByTrainer[id], "StatsBoost");
	appendCategory(abilityPanelByTrainer[id], "MovePowerAccuracyBoost");
	appendCategory(abilityPanelByTrainer[id], "AdditionalMoveEffect");
	appendCategory(abilityPanelByTrainer[id], "Passive");
	appendCategory(abilityPanelByTrainer[id], "SyncMove");

	textarea.value += "[/table][/center]";

	document.getElementById("nbCells").innerText = abilityPanelByTrainer[id].nbCells;
}

function setEvent(id, entry = null) {
	//setStats(id);
	getEventData(id).then(() => {
		raidsListSelect.value = id;

		setAnchors(id);
		setPokemon(entry);

		setUrlEventID(id, entry);
	});
}

function setAnchors() {
	pokemonListSpan.innerHTML = "<b>Liste des Raids de l'événement :</b>";
	let i = 0;

	encData.filter(enc => enc.RaidEnemyInfo.Rate > 0).forEach(enc => {
		let anchor = document.createElement('a');
		anchor.href = '#';
		anchor.textContent = `${specieNames[enc.RaidEnemyInfo.BossPokePara.DevId]} ${enc.RaidEnemyInfo.Difficulty}★`;

		anchor.onclick = function() {
			setUrlEventID(raidsListSelect.value, enc.RaidEnemyInfo.No);
			setPokemon(enc.RaidEnemyInfo.No);
		};

		pokemonListSpan.appendChild(document.createElement('br'));
		pokemonListSpan.appendChild(anchor);

		i++;
	});
}

function setPokemon(id) {
	id = id ?? encData[0].RaidEnemyInfo.No;

	/*	INFOS TALENTS (Tokusei) :
		RANDOM_12 = 0,
		RANDOM_123 = 1,
		SET_1 = 2,
		SET_2 = 3,
		SET_3 = 4,
	*/
}

function appendCategory(trainer, category) {
	
	if(typeof trainer[category] === 'undefined') {
		return;
	}
	
	raidTable.innerHTML += "<tr><th style='background-color:" + bgColor[category] + ";' colspan=5>" + abilityTypeTitle[category] + "</th></tr>\n";
	textarea.value += "\t[tr][th|bgcolor=" + bgColor[category] + "|colspan=5]" + abilityTypeTitle[category] + "[/th][/tr]\n"

	trainer[category].forEach(cell => {
		let amelioration = getReplacedText(abilityName[cell.ability.type], cell.ability);
		let amelioLevel = Number.isInteger(amelioration.slice(-1)*1) ? amelioration.slice(-1)*1 : null;
		let passiveDescr = '-';
		
		if(cell.ability.passiveId !== 0) {
			passiveDescr = passiveList[cell.ability.passiveId].description;
			
			if(amelioLevel !== null) {
				passiveDescr = getCleanDescr(passiveDescr, amelioLevel);
			}
		}
	
		raidTable.innerHTML += "<tr><td>" + amelioration
			+ `</td><td${(passiveDescr.includes("[") || passiveDescr.includes("]")) ? " style='background-color:#f2748e;'" : ""}>` + outlineBrackets(passiveDescr)
			+ "</td><td>" + (cell.energyCost === 0 ? '-' : cell.energyCost)
			+ "</td><td>" + cell.orbCost
			+ "</td><td>" + cell.level
			+ "</td></tr>\n";
		
		textarea.value += "\t[tr]\n\t[td]" + amelioration
			+ "[/td]\n\t[td]" + passiveDescr
			+ "[/td]\n\t[td]" + (cell.energyCost === 0 ? '-' : cell.energyCost)
			+ "[/td]\n\t[td]" + cell.orbCost + " [img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/duo-sphere.png[/img]"
			+ "[/td]\n\t[td][img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/niveau-capacites-" + cell.level.charAt(0) + ".png[/img]"
			+ "[/td]\n\t[/tr]\n"
	});
}

function setUrlEventID(id, entry = null) {
	const url = new URL(window.location);
	url.searchParams.set('eventId', id);
	url.searchParams.set('entry', entry ?? encData[0].RaidEnemyInfo.No);

	window.history.pushState(null, '', url.toString());
}

async function init() {
	btnCopy = document.getElementById("btnCopy");
	raidTable = document.getElementById("raidTable");
	textarea = document.getElementById("area");
	raidsListSelect = document.getElementById("raidsList");
	pokemonListSpan = document.getElementById("pokemonList");

	await getData();
	await getEventDirectories();

	raidsListSelect.onchange = function() {
		setEvent(raidsListSelect.value);
	};

	btnCopy.onclick = function() {
		navigator.clipboard.writeText(textarea.value);
	};

	const urlEventId = new URL(window.location).searchParams.get('eventId');
	const urlEntryId = new URL(window.location).searchParams.get('entry');

	if(urlEventId !== null) {
		raidsListSelect.value = urlEventId;
	}

	setEvent(raidsListSelect.value, urlEntryId);
}

init().then(() => {
	document.getElementById("btnSave").onclick = function () {
		let currEvent = raidsListSelect.value;
		let dlCount = document.getElementById("dlCount");
		let i = 1;

		for(const opt of raidsListSelect.options) {
			dlCount.innerText = `Génération du fichier no ${i}/${raidsListSelect.options.length}...`;
			setEvent(opt.value);
			let filename = opt.text.replace(/[/\\?%*:|"<>]/g, '_') + ".txt";
			zip.file(filename, textarea.value);
		}

		setEvent(currEvent);
		dlCount.innerText = `Génération du zip...`;

		zip.generateAsync({ type: 'blob' })
			.then(function(content) {
				saveAs(content, "event-raids.zip");
				dlCount.innerText = '';
			});
	};
});