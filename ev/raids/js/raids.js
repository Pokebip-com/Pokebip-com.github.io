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
let resourceNames;
let moveNames;
let specieNames;
let tmNames;
let typeNames;

let personalArray;
let wazaArray;
let formToSprite;
let itemIdToBipname;

const normalTeraShardId = 1862;
const firstResourceId = 1956;
const lastResourceId = 2159;

let btnCopy;
let raidTable;
let textarea;
let raidsListSelect;
let pokemonListSpan;

let zip = new JSZip();

async function getData() {
	const languagePath = dataPath + '/' + language + '/';
	const customPath = dataPath + '/custom/';

	const [
		abilityNamesResponse,
		itemNamesResponse,
		moveNamesResponse,
		specieNamesResponse,
		tmNamesResponse,
		typeNamesResponse,

		personalArrayResponse,
		wazaArrayResponse,

		formToSpriteResponse,
		itemIdToBipnameResponse
	] = await Promise.all([
		fetch(languagePath + 'abilities.txt'),
		fetch(languagePath + 'items.txt'),
		fetch(languagePath + 'moves.txt'),
		fetch(languagePath + 'species.txt'),
		fetch(languagePath + 'tm.txt'),
		fetch(languagePath + 'typename.txt'),

		fetch(dataPath + '/' + 'personal_array.json'),
		fetch(dataPath + '/' + 'waza_array.json'),

		fetch(customPath + 'form-to-sprite.json'),
		fetch(customPath + 'itemid-to-bipname.json')
	])
		.catch(error => console.log(error));

	abilityNames = (await abilityNamesResponse.text()).split(/\r?\n/);
	itemNames = (await itemNamesResponse.text()).split(/\r?\n/);
	moveNames = (await moveNamesResponse.text()).split(/\r?\n/);
	specieNames = (await specieNamesResponse.text()).split(/\r?\n/);
	tmNames = (await tmNamesResponse.text()).split(/\r?\n/);
	typeNames = (await typeNamesResponse.text()).split(/\r?\n/);

	personalArray = (await personalArrayResponse.json()).Table.filter(p => p.IsPresentInGame);
	wazaArray = (await wazaArrayResponse.json()).Table.filter(w => w.CanUseMove);

	formToSprite = await formToSpriteResponse.json();
	itemIdToBipname = await itemIdToBipnameResponse.json();

	itemNames = itemNames.map(item => {
		if(/CT[0-9]{3}/g.test(item))
			return item + " " + tmNames[parseInt(item.substring(2))-1].split('\t')[1];

		return item;
	});

	resourceNames = itemNames.slice(firstResourceId, lastResourceId);
}

async function getEventDirectories() {
	const response = await fetch('https://api.github.com/repos/pokebip-com/Pokebip-com.github.io/contents/ev/raids' + eventsPath.substring(1));
	const dataDir = await response.json();

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

	encData = (await encDataResponse.json()).Table;
	priorityData = (await priorityDataResponse.json()).Table;
	dropData = (await dropDataResponse.json()).Table;
	bonusDropData = (await bonusDropDataResponse.json()).Table;
}

function setEvent(id, entry = null) {
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

	let raidEnemy = encData.find(enc => enc.RaidEnemyInfo.No == id);

	if(typeof raidEnemy === "undefined") {
		console.log("undefined Raid Enemy...");
		return;
	}

	raidEnemy = raidEnemy.RaidEnemyInfo;

	textarea.value = "[center][table]\n";

	let html = "";

	// TH Nom du Pokémon
	html = `<thead><tr><th colspan="4">${specieNames[raidEnemy.BossPokePara.DevId]} ${raidEnemy.Difficulty}★</th></tr></thead>`;
	textarea.value += `\t[tr]\n\t\t[th|colspan=4]${specieNames[raidEnemy.BossPokePara.DevId]} ${raidEnemy.Difficulty}★[/th]\n\t[/tr]\n`;

	let imgName = formToSprite[raidEnemy.BossPokePara.DevId + "-" + raidEnemy.BossPokePara.FormId] || raidEnemy.BossPokePara.DevId;

	// TD pokeimg
	html += `<tbody><tr><td colspan="4"><img src="../../images/ev-sprites/${imgName}.png" /></td></tr>`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4][minipoke=${imgName}|EV][/td]\n\t[/tr]\n`;

	// TD Niveau
	html += `<tr><td colspan="4">Niv. ${raidEnemy.CaptureLv}</td></tr>`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4]Niv. ${raidEnemy.CaptureLv}[/td]\n\t[/tr]\n`;

	// TD Capturable qu'une seule fois
	if(raidEnemy.CaptureRate === 2) {
		const oneTime = "1 exemplaire max. capturable";

		html += `<tr><td colspan="4" style="background-color: red; color: white"><b>${oneTime}</b></td></tr>`;
		textarea.value += `\t[tr]\n\t\t[td|colspan=4|bgcolor=red][b][color=white]${oneTime}[/color][/b][/td]\n\t[/tr]\n`;
	}

	// TD TerraType
	let terraTypeID = raidEnemy.BossPokePara.GemType - 1;

	html += `<tr><td colspan="4">`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4]`;

	let teraType = "";
	let isText = false;

	switch(terraTypeID) {
		case -1:
			console.log("Terra Type is default ???");
			break;

		case 0:
			teraType = "Aléatoire";
			isText = true;
			break;

		default:
			teraType = getTypeName(terraTypeID - 1);
			break;
	}

	html += "<b>Type Téracristal :</b> ";
	textarea.value += "[b]Type Téracristal :[/b] ";

	if(isText) {
		html += teraType;
		textarea.value += teraType;
	}
	else {
		html += `<img src="../../images/types/tera-${teraType}.png" />`;
		textarea.value += `[type=tera-${teraType}|9G]`;
	}

	html += `</td></tr>`;
	textarea.value += `[/td]\n\t[/tr]\n`;

	// TD Talent
	html += `<tr><td colspan="4">`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4]`;

	let ability;

	switch(raidEnemy.BossPokePara.Tokusei) {
		case 0 :
			ability = "Aléatoire (non-caché)";
			break;

		case 1:
			ability = "Aléatoire";
			break;

		default:
			ability = getPokemonAbilityName(raidEnemy.BossPokePara.DevId, raidEnemy.BossPokePara.FormId, raidEnemy.BossPokePara.Tokusei - 1);
	}

	html += `<b>Talent :</b> ${ability}</td></tr>`;
	textarea.value += `[b]Talent :[/b] ${ability}[/td]\n\t[/tr]\n`;

	// TD Attaques
	html += `<tr><td colspan="4"><div style="text-align: left">`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4][left]`;

	let nbMoves = 0;

	for(let i = 1; i <= 4; i++) {
		let moveID = raidEnemy.BossPokePara["Waza" + i].WazaId;
		let move = wazaArray.find(waza => waza.MoveID === moveID);

		if(moveID === 0 || typeof move === "undefined") {
			continue;
		}

		let moveType = getTypeName(move.Type);
		let moveName = moveNames[moveID];

		html += `${nbMoves > 0 ? '<br />' : ''}<img src="../../images/types/${moveType}-mini.png" /> ${moveName}`;
		textarea.value += `${nbMoves > 0 ? '[br]' : ''}[type=${moveType}-mini|9G] ${moveName}`;

		nbMoves++;
	}

	for(let i = 4; i > nbMoves; i--) {
		html += nbMoves > 0 ? '<br />-' : '-';
		textarea.value += nbMoves > 0 ? '[br]-' : '-';
	}

	html += "</div></td></tr>";
	textarea.value += '[/left][/td]\n\t[/tr]\n';

	// TD Attaques supplémentaires
	let isMoreMoves = false;
	nbMoves = 0;

	for(let i = 1; i <= 6; i++) {
		let [action, wazaNo] = [raidEnemy.BossDesc["ExtraAction" + i].Action, raidEnemy.BossDesc["ExtraAction" + i].Wazano];
		let move = wazaArray.find(waza => waza.MoveID === wazaNo);

		if(action !== 3 || wazaNo === 0 || typeof move === "undefined") {
			continue;
		}

		if(!isMoreMoves) {
			html += `<tr><td colspan="4"><div style="text-align: left">`;
			textarea.value += `\t[tr]\n\t\t[td|colspan=4][left]`;

			isMoreMoves = true;
		}

		let moveType = getTypeName(move.Type);
		let moveName = moveNames[wazaNo];

		html += `${nbMoves > 0 ? '<br />' : ''}<img src="../../images/types/${moveType}-mini.png" /> ${moveName}`;
		textarea.value += `${nbMoves > 0 ? '[br]' : ''}[type=${moveType}-mini|9G] ${moveName}`;

		nbMoves++;
	}

	if(isMoreMoves) {
		html += "</div></td></tr>";
		textarea.value += '[/left][/td]\n\t[/tr]\n';
	}

	const rewardsTitle = "Récompenses";
	html += `<tr><th colspan="4">${rewardsTitle}</th></tr>`;
	textarea.value += `\t[tr]\n\t\t[th|colspan=4]${rewardsTitle}[/th]\n\t[/tr]\n`;

	html += `<tr><th>Nb</th><th colspan="2">Objet</th><th>Proba</th></tr>`;
	textarea.value += `\t[tr]\n\t\t[th]Nb[/th]\n\t\t[th|colspan=2]Objet[/th]\n\t\t[th]Proba[/th]\n\t[/tr]\n`;

	let [fixedDropsHTML, fixedDropsBipcode] = getFixedDrops(raidEnemy.DropTableFix, terraTypeID, raidEnemy.BossPokePara.DevId);

	html += fixedDropsHTML;
	textarea.value += fixedDropsBipcode;

	let [bonusDropsHTML, bonusDropsBipcode] = getBonusDrops(raidEnemy.DropTableRandom, terraTypeID, raidEnemy.BossPokePara.DevId);

	html += bonusDropsHTML;
	textarea.value += bonusDropsBipcode;

	html += "</tbody></table>";
	textarea.value += "[/table][/center]";

	raidTable.innerHTML = html;
}

// TODO Merge les deux fonctions de drops... ?
function getFixedDrops(tableId, teraTypeId, pokemonId) {
	let table = dropData.find(t => t.TableName === tableId);

	if(typeof table === "undefined") {
		return [null, null];
	}

	const teraShardId = teraTypeId === 0 ? normalTeraShardId : normalTeraShardId + teraTypeId - 2;
	const teraShardName = teraTypeId === 0 ? "Téra-Éclat du type" : itemNames[teraShardId];
	const baseMonName = getBaseMonName(pokemonId);
	const resourceIndex = firstResourceId + resourceNames.findIndex(res => res.includes(baseMonName));
	let html = "";
	let bipcode = "";

	for(let i = 0; i < 15; i++) {
		let reward = table["RewardItem" + i.toString().padStart(2, '0')];

		if(reward.Num === 0) {
			continue;
		}

		html += `<tr><td>${reward.Num}x</td><td>`;
		bipcode += `\t[tr]\n\t\t[td]${reward.Num}x[/td]\n\t\t[td]`;

		switch(reward.Category) {
			case 0:
				html += `<img src="../../images/items/item_${reward.ItemID.toString().padStart(4, '0')}.png" width="30" height="30" /></td><td>${itemNames[reward.ItemID]}`;
				bipcode += `[objet=${itemIdToBipname[reward.ItemID]}|EV][/td]\n\t\t[td]${itemNames[reward.ItemID]}`;
				if(typeof itemIdToBipname[reward.ItemID] === "undefined") {
					console.log(`UNDEFINED ITEM; ID = ${reward.ItemID}; Name = ${itemNames[reward.ItemID]}`)
				}
				break;

			case 1:
				html += `<img src="../../images/items/item_${resourceIndex}.png" width="30" height="30" /></td><td>${itemNames[resourceIndex]}`;
				bipcode += `[objet=${itemIdToBipname[resourceIndex]}|EV][/td]\n\t\t[td]${itemNames[resourceIndex]}`;
				break;

			case 2:
				html += `<img src="../../images/items/item_${teraShardId}.png" width="30" height="30" /></td><td>${teraShardName}`;
				bipcode += `[objet=${itemIdToBipname[teraShardId]}|EV][/td]\n\t\t[td]${teraShardName}`;
				break;

		}

		if(reward.SubjectType > 0) {
			html += `<br /><span style="font-size: 80%;">`;
			bipcode += `[br][size=80%]`;
		}

		// noinspection JSDuplicateCaseLabel
		switch(reward.SubjectType) {
			case 1:
				html += `Hôte uniquement</span>`;
				bipcode += `Hôte uniquement[/size]`;
				break;
			case 2:
				html += `Tous sauf l'hôte</span>`;
				bipcode += `Tous sauf l'hôte[/size]`;
				break;
			case 3:
				html += `Seulement une fois</span>`;
				bipcode += `Seulement une fois[/size]`;
				break;
		}

		html += `</td><td>100%</td></tr>`;
		bipcode += `[/td]\n\t\t[td]100%[/td]\n\t[/tr]\n`;
	}

	return [html, bipcode];

}

function getBonusDrops(tableId, teraTypeId, pokemonId) {
	let table = bonusDropData.find(t => t.TableName === tableId);

	if(typeof table === "undefined") {
		return [null, null];
	}

	const teraShardId = teraTypeId === 0 ? normalTeraShardId : normalTeraShardId + teraTypeId - 2;
	const teraShardName = teraTypeId === 0 ? "Téra-Éclat du type" : itemNames[teraShardId];
	const baseMonName = getBaseMonName(pokemonId);
	const resourceIndex = firstResourceId + resourceNames.findIndex(res => res.includes(baseMonName));
	let html = "";
	let bipcode = "";

	for(let i = 0; i < 30; i++) {
		let reward = table["RewardItem" + i.toString().padStart(2, '0')];

		if(reward.Num === 0) {
			continue;
		}

		html += `<tr><td>${reward.Num}x</td><td>`;
		bipcode += `\t[tr]\n\t\t[td]${reward.Num}x[/td]\n\t\t[td]`;

		switch(reward.Category) {
			case 0:
				html += `<img src="../../images/items/item_${reward.ItemID.toString().padStart(4, '0')}.png" width="30" height="30" /></td><td>${itemNames[reward.ItemID]}`;
				bipcode += `[objet=${itemIdToBipname[reward.ItemID]}|EV][/td]\n\t\t[td]${itemNames[reward.ItemID]}`;
				if(typeof itemIdToBipname[reward.ItemID] === "undefined") {
					console.log(`UNDEFINED ITEM; ID = ${reward.ItemID}; Name = ${itemNames[reward.ItemID]}`)
				}
				break;

			case 1:
				html += `<img src="../../images/items/item_${resourceIndex}.png" width="30" height="30" /></td><td>${itemNames[resourceIndex]}`;
				bipcode += `[objet=${itemIdToBipname[resourceIndex]}|EV][/td]\n\t\t[td]${itemNames[resourceIndex]}`;
				break;

			case 2:
				html += `<img src="../../images/items/item_${teraShardId}.png" width="30" height="30" /></td><td>${teraShardName}`;
				bipcode += `[objet=${itemIdToBipname[teraShardId]}|EV][/td]\n\t\t[td]${teraShardName}`;
				break;

		}

		html += `</td><td>${reward.Rate}%</td></tr>`;
		bipcode += `[/td]\n\t\t[td]${reward.Rate}%[/td]\n\t[/tr]\n`;
	}

	return [html, bipcode];
}

function getBaseMonName(pokemonId) {
	let pokeInfo = personalArray.find(p => p.Info.DexIndexNational === pokemonId);

	if(typeof pokeInfo === "undefined") {
		return "Pikachu";
	}

	return specieNames[pokeInfo.Hatch.Species];
}

function getPokemonAbilityName(DevId, FormId, Tokusei) {
	let pokemon = personalArray.find(p => p.Info.DexIndexNational === DevId && p.Info.Form === FormId);

	if(Tokusei === 3)
		Tokusei = "H";

	return abilityNames[pokemon["Ability" + Tokusei]];
}

function getTypeName(typeId) {
	return typeNames[typeId].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
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

	const url = new URL(window.location);
	const urlEventId = url.searchParams.get('eventId');
	const urlEntryId = url.searchParams.get('entry');

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

			let content = "[listh]\n";

			encData.filter(enc => enc.RaidEnemyInfo.Rate > 0).forEach(enc => {
				setPokemon(enc.RaidEnemyInfo.No);
				setUrlEventID(opt.value, enc.RaidEnemyInfo.No);

				content += `[item|nostyle]\n${textarea.value}\n[/item]\n`;
			});

			content += "[/listh]";

			zip.file(filename, content);
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