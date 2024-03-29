const dataPath = "./data";
const eventsPath = dataPath + '/events/';
const standardPath = dataPath + '/standard/';
const language = "French";

let encData;
let infoKeyName;
let fixedDropData;
let bonusDropData

let abilityNames;
let natureNames;
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
const lastResourceId = 2160;

const raidTypes = Object.freeze({"STANDARD" : 1, "EVENT" : 2});
const versions = ["" , "Pokémon Écarlate", "Pokémon Violet"];
let selectedType;

let btnCopy;
let raidTable;
let textarea;
let jsonData;
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
		natureNamesResponse,
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
		fetch(languagePath + 'seikaku.txt'),
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
	natureNames = (await natureNamesResponse.text()).split(/\r?\n/);
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

async function getStandardDirectories() {
	const response = await fetch('https://api.github.com/repos/pokebip-com/Pokebip-com.github.io/contents/ev/raids' + standardPath.substring(1));

	let dataDir = await response.json();
	dataDir = dataDir.filter(entry => entry.type === "dir");

	dataDir.sort((a, b) => a.name.localeCompare(b.name))

	let optGroup = document.createElement("OPTGROUP");

	optGroup.label = "Standard";
	optGroup.id = raidTypes.STANDARD;

	for(let dir of dataDir) {
		let stars = dir.name.charAt(0);
		let opt = new Option(`Raids ${stars}★`, dir.name);
		opt.setAttribute("data-stars", stars);
		optGroup.appendChild(opt);
	}

	raidsListSelect.add(optGroup);
}

async function getEventDirectories() {
	const response = await fetch('https://api.github.com/repos/pokebip-com/Pokebip-com.github.io/contents/ev/raids' + eventsPath.substring(1));

	let dataDir = await response.json();
	dataDir = dataDir.filter(entry => entry.type === "dir");

	dataDir.sort((a, b) => b.name.localeCompare(a.name))

	let optGroup = document.createElement("OPTGROUP");

	optGroup.label = "Événements";
	optGroup.id = raidTypes.EVENT;

	for(let dir of dataDir) {
		optGroup.appendChild(new Option(dir.name, dir.name))
	}

	raidsListSelect.add(optGroup);
}

async function getStandardData(id) {
	const path = standardPath + id + '/';

	await getDataOf(path, standardPath);
}

async function getEventData(event) {
	const eventPath = eventsPath + event + '/';

	await getDataOf(eventPath, eventPath);
}

async function getDataOf(encPath, dropsPath) {
	const [
		encDataResponse,
		dropDataResponse,
		bonusDropDataResponse
	] = await Promise.all([
		fetch(encPath + "enc.json"),
		fetch(dropsPath + "drop.json"),
		fetch(dropsPath + "bonus.json"),
	])
		.catch(error => console.log(error));

	encData = (await encDataResponse.json()).Table;
	infoKeyName = "RaidEnemyInfo" in encData[0] ? "RaidEnemyInfo" : "Info";
	fixedDropData = (await dropDataResponse.json()).Table;
	bonusDropData = (await bonusDropDataResponse.json()).Table;
}

async function getRaidData(id) {
	selectedType = document.querySelector('#raidsList option:checked').parentElement.id;

	if(selectedType == raidTypes.EVENT) {
		await getEventData(id);
	}
	else if(selectedType == raidTypes.STANDARD) {
		await getStandardData(id);
	}
	else {
		console.error("Unknown raid type selected...");
	}
}

function syntaxHighlight(json) {
	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
		var cls = 'number';
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = 'key';
			} else {
				cls = 'string';
			}
		} else if (/true|false/.test(match)) {
			cls = 'boolean';
		} else if (/null/.test(match)) {
			cls = 'null';
		}
		return '<span class="' + cls + '">' + match + '</span>';
	});
}

function setEvent(id, entry = null, setUrl = true) {
	raidsListSelect.value = id;

	getRaidData(id).then(() => {
		setAnchors(id);
		setPokemon(entry);
		if(setUrl)
			setUrlEventID(id, entry);
	});
}

function setAnchors() {
	pokemonListSpan.innerHTML = "<b>Liste des Raids de l'événement :</b>";
	let i = 0;

	encData.filter(enc => enc[infoKeyName].Rate > 0)
		.sort((a, b) => {
			let nationalIdA = getNationalIdFromDevId(a[infoKeyName].BossPokePara.DevId, a[infoKeyName].BossPokePara.FormId);
			let nationalIdB = getNationalIdFromDevId(b[infoKeyName].BossPokePara.DevId, b[infoKeyName].BossPokePara.FormId);

			if(nationalIdA > nationalIdB) return 1;
			if(nationalIdA < nationalIdB) return -1;

			if(a[infoKeyName].BossPokePara.FormId > b[infoKeyName].BossPokePara.FormId) return 1;
			if(a[infoKeyName].BossPokePara.FormId < b[infoKeyName].BossPokePara.FormId) return -1;

			if(a[infoKeyName].Difficulty > b[infoKeyName].Difficulty) return 1;
			if(a[infoKeyName].Difficulty < b[infoKeyName].Difficulty) return -1;
		})
		.forEach(enc => {
			let anchor = document.createElement('a');
			let difficulty = enc[infoKeyName].Difficulty || raidsListSelect.options[raidsListSelect.selectedIndex].getAttribute("data-stars");
			let formText = enc[infoKeyName].BossPokePara.FormId > 0 ? `-${enc[infoKeyName].BossPokePara.FormId}` : "";
			anchor.href = '#';
			anchor.textContent = `${specieNames[getNationalIdFromDevId(enc[infoKeyName].BossPokePara.DevId, enc[infoKeyName].BossPokePara.FormId)]}${formText} ${difficulty}★`;
			anchor.setAttribute("data-raid-id", enc[infoKeyName].No);

			anchor.onclick = function() {
				setUrlEventID(raidsListSelect.value, enc[infoKeyName].No);
				setPokemon(enc[infoKeyName].No);
			};

			pokemonListSpan.appendChild(document.createElement('br'));
			pokemonListSpan.appendChild(anchor);

			i++;
	});
}

function setPokemon(id) {
	id = id ?? encData[0][infoKeyName].No;

	let raidEnemy = encData.find(enc => enc[infoKeyName].No == id);

	if(typeof raidEnemy === "undefined") {
		console.log("undefined Raid Enemy...");
		return;
	}

	raidEnemy = raidEnemy[infoKeyName];
	let difficulty = raidEnemy.Difficulty || raidsListSelect.options[raidsListSelect.selectedIndex].getAttribute("data-stars");

	textarea.value = "[center][table]\n";

	let html;
	let versionNo = parseInt(raidEnemy.RomVer);
	let nationalId = getNationalIdFromDevId(raidEnemy.BossPokePara.DevId, raidEnemy.BossPokePara.FormId);

	// TH Nom du Pokémon
	html = `<thead><tr><th colspan="4">${specieNames[nationalId]} ${difficulty}★`;
	textarea.value += `\t[tr]\n\t\t[th|colspan=4]${specieNames[nationalId]} ${difficulty}★`;

	if(versionNo > 0) {
		let title = `Exclusif à ${versions[versionNo]}`;
		html += ` <span data-toggle="tooltip" data-placement="auto bottom" data-html="true" class="has-tooltip" title="${title}" data-original-title="${title}">`;
		html += `<img src="../../images/ev-emblems/icon_emblem_${versionNo}.png" width="30px" height="30px" /></span>`;
		textarea.value += ` [tooltip=[img]/pages/jeuxvideo/pokemon-ecarlate-violet/images/logos/icon_emblem_${versionNo}.png[/img]]${title}[/tooltip]`;
	}

	html += `</th></tr></thead>`;
	textarea.value += `[/th]\n\t[/tr]\n`;
	let imgName = formToSprite[nationalId + "-" + raidEnemy.BossPokePara.FormId] || nationalId;

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
	let terraTypeID = raidEnemy.BossPokePara.GemType;

	html += `<tr><td colspan="4">`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4]`;

	let teraType = [];
	let isText = false;

	switch(terraTypeID) {
		case 0:
			teraType = getPokemonTypeNames(raidEnemy.BossPokePara.DevId, raidEnemy.BossPokePara.FormId);
			break;

		case 1:
			teraType.push("Aléatoire");
			isText = true;
			break;

		default:
			teraType.push(getTypeName(terraTypeID - 2));
			break;
	}

	html += "<b>Type Téracristal :</b> ";
	textarea.value += "[b]Type Téracristal :[/b] ";

	if(isText) {
		html += teraType;
		textarea.value += teraType;
	}
	else {
		for(let i = 0; i < teraType.length; i++) {
			html += `${i > 0 ? " ou " : ""}<img src="../../images/types/tera-${teraType[i]}.png" />`;
			textarea.value += `${i > 0 ? " ou " : ""}[type=tera-${teraType[i]}|9G]`;
		}
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

	// TD Nature
	html += `<tr><td colspan="4">`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4]`;

	let nature = natureNames[raidEnemy.BossPokePara.Seikaku];

	html += `<b>Nature :</b> ${nature}</td></tr>`;
	textarea.value += `[b]Nature :[/b] ${nature}[/td]\n\t[/tr]\n`;

	// TD Objet
	if(raidEnemy.BossPokePara.Item > 0) {
		html += `<tr><td colspan="4">`;
		textarea.value += `\t[tr]\n\t\t[td|colspan=4]`;

		item = itemNames[raidEnemy.BossPokePara.Item];

		html += `<b>Objet :</b> <img src="../../images/items/item_${raidEnemy.BossPokePara.Item.toString().padStart(4, '0')}.png" width="30" height="30" /> ${item}</td></tr>`;
		textarea.value += `[b]Objet :[/b] [objet=${itemIdToBipname[raidEnemy.BossPokePara.Item]}|EV] ${item}[/td]\n\t[/tr]\n`;

	}

	// TD Attaques
	html += `<tr><td colspan="4"><div style="text-align: left">`;
	textarea.value += `\t[tr]\n\t\t[td|colspan=4][left]`;

	let nbMoves = 0;
	let addedMoveIDs = [];

	for(let i = 1; i <= 4; i++) {
		let moveID = raidEnemy.BossPokePara["Waza" + i].WazaId;
		let move = wazaArray.find(waza => waza.MoveID === moveID);

		if(moveID === 0 || typeof move === "undefined") {
			continue;
		}

		let moveType = getTypeName(move.Type);
		let moveName = moveNames[moveID];

		html += `${nbMoves > 0 ? '<br />' : ''}<img src="../../images/types/${moveType}.png" /> ${moveName}`;
		textarea.value += `${nbMoves > 0 ? '[br]' : ''}[type=${moveType}|9G] ${moveName}`;

		addedMoveIDs.push(raidEnemy.BossPokePara["Waza" + i].WazaId);
		nbMoves++;
	}

	html += "</div></td></tr>";
	textarea.value += '[/left][/td]\n\t[/tr]\n';

	// TD Attaques supplémentaires
	let isMoreMoves = false;
	nbMoves = 0;

	for(let i = 1; i <= 6; i++) {
		let [action, wazaNo] = [raidEnemy.BossDesc["ExtraAction" + i].Action, raidEnemy.BossDesc["ExtraAction" + i].Wazano];
		let move = wazaArray.find(waza => waza.MoveID === wazaNo);

		if(action !== 3 || wazaNo === 0 || addedMoveIDs.includes(wazaNo) || typeof move === "undefined") {
			continue;
		}

		if(!isMoreMoves) {
			html += `<tr><td colspan="4"><div style="text-align: left">`;
			textarea.value += `\t[tr]\n\t\t[td|colspan=4][left]`;

			isMoreMoves = true;
		}

		let moveType = getTypeName(move.Type);
		let moveName = moveNames[wazaNo];

		html += `${nbMoves > 0 ? '<br />' : ''}<img src="../../images/types/${moveType}.png" /> ${moveName}`;
		textarea.value += `${nbMoves > 0 ? '[br]' : ''}[type=${moveType}|9G] ${moveName}`;

		addedMoveIDs.push(wazaNo);
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

	let [fixedDropsHTML, fixedDropsBipcode] = getDrops(fixedDropData, raidEnemy.DropTableFix, terraTypeID, raidEnemy.BossPokePara.DevId);

	html += fixedDropsHTML;
	textarea.value += fixedDropsBipcode;

	let [bonusDropsHTML, bonusDropsBipcode] = getDrops(bonusDropData, raidEnemy.DropTableRandom, terraTypeID, raidEnemy.BossPokePara.DevId);

	html += bonusDropsHTML;
	textarea.value += bonusDropsBipcode;

	html += "</tbody></table>";
	textarea.value += "[/table][/center]";

	raidTable.innerHTML = html;

	jsonData.innerHTML = syntaxHighlight(JSON.stringify(raidEnemy, null, 2));

}

function getDrops(dropData, tableId, teraTypeId, pokemonId) {
	let table = dropData.find(t => t.TableName === tableId);

	if(typeof table === "undefined") {
		return [null, null];
	}

	let divider = 1;

	const teraShardName = teraTypeId <= 1 ? "Téra-Éclat du type" : `Téra-Éclat ${typeNames[teraTypeId-2]}`;
	const teraShardId =  teraTypeId <= 1 ? normalTeraShardId : itemNames.indexOf(teraShardName);
	const baseMonName = getBaseMonName(pokemonId);
	const resourceIndex = firstResourceId + resourceNames.findIndex(res => res.includes(baseMonName));
	let html = "";
	let bipcode = "";

	let isFixed = "SubjectType" in table["RewardItem00"];

	if(!isFixed) {
		Object.keys(table).filter(k => k.startsWith("RewardItem")).forEach(key => {
			while(table[key].Rate/divider > 100) {
				divider *= 10;
			}
		});
	}

	for(let i = 0, rewardKey = "RewardItem" + i.toString().padStart(2, '0'); typeof table[rewardKey] !== "undefined"; i++, rewardKey = "RewardItem" + i.toString().padStart(2, '0')) {
		let reward = table[rewardKey];

		if(reward.Num === 0 || (reward.Category === 1 && resourceIndex < firstResourceId)) {
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

		if(isFixed)
		{
			if(reward.SubjectType > 0) {
				html += `<br /><span style="font-size: 80%;">`;
				bipcode += `[br][size=80%]`;

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
			}

			html += `</td><td>100%</td></tr>`;
			bipcode += `[/td]\n\t\t[td]100%[/td]\n\t[/tr]\n`;

		}
		else {
			html += `</td><td>${reward.Rate/divider}%</td></tr>`;
			bipcode += `[/td]\n\t\t[td]${reward.Rate/divider}%[/td]\n\t[/tr]\n`;
		}
	}

	return [html, bipcode];
}

function getBaseMonName(pokemonId) {
	let pokeInfo = personalArray.find(p => p.Info.SpeciesInternal === pokemonId);

	if(typeof pokeInfo === "undefined") {
		return "Pikachu";
	}

	return specieNames[pokeInfo.Hatch.SpeciesInternal];
}

function getNationalIdFromDevId(DevId, FormId) {
	let pokemon = personalArray.find(p => p.Info.SpeciesInternal === DevId && p.Info.Form === FormId);

	return pokemon.Info.SpeciesNational;
}

function getPokemonAbilityName(DevId, FormId, Tokusei) {
	let pokemon = personalArray.find(p => p.Info.SpeciesInternal === DevId && p.Info.Form === FormId);

	if(Tokusei === 3)
		Tokusei = "H";

	return abilityNames[pokemon["Ability" + Tokusei]];
}

function getPokemonTypeNames(DevId, FormId) {
	let pokemon = personalArray.find(p => p.Info.SpeciesInternal === DevId && p.Info.Form === FormId);

	return [... new Set([getTypeName(pokemon.Type1), getTypeName(pokemon.Type2)].filter(t => t !== ""))];
}

function getTypeName(typeId) {
	return typeNames[typeId].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function setUrlEventID(id, entry = null) {
	const url = new URL(window.location);
	url.searchParams.set('eventId', id);
	url.searchParams.set('entry', entry ?? encData[0][infoKeyName].No);

	window.history.pushState(null, '', url.toString());
}

async function init() {
	btnCopy = document.getElementById("btnCopy");
	raidTable = document.getElementById("raidTable");
	textarea = document.getElementById("area");
	jsonData = document.getElementById("jsonData");
	raidsListSelect = document.getElementById("raidsList");
	pokemonListSpan = document.getElementById("pokemonList");

	await getData();
	await getStandardDirectories();
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
	document.getElementById("btnSaveAll").onclick = async function () {
		let currEvent = raidsListSelect.value;
		let dlCount = document.getElementById("dlCount");
		let standard = zip.folder("standard");
		let events = zip.folder("events");

		let indiv = zip.folder("_indiv");
		let indivStandard = indiv.folder("standard");
		let indivEvents = indiv.folder("events");

		for(const opt of raidsListSelect.options) {
			dlCount.innerText = `Génération du zip...`;

			raidsListSelect.value = opt.value;
			await getRaidData(opt.value);
			setAnchors(opt.value);

			let filename = opt.text.replace(/[/\\?%*:|"<>]/g, '_') + ".txt";
			let content = "[listh]\n";

			for (const raid of encData.filter(enc => enc[infoKeyName].Rate > 0)) {
				await setPokemon(raid[infoKeyName].No);

				let raidName = document.querySelector(`[data-raid-id="${raid[infoKeyName].No}"]`).innerText;
				let indivFilename = raid[infoKeyName].No + "-" + raidName.replace(/[/\\?%*:|"<>]/g, '_') + ".txt";

				if(selectedType == raidTypes.STANDARD) {
					indivStandard.file(opt.value + "/" + indivFilename, textarea.value);
				}
				else if(selectedType == raidTypes.EVENT) {
					indivEvents.file(opt.value + "/" + indivFilename, textarea.value);
				}
				else {
					indiv.file(opt.value + "/" + indivFilename, textarea.value);
				}

				content += `[item|nostyle]\n${textarea.value}\n[/item]\n`;
			}

			content += "[/listh]";

			if(selectedType == raidTypes.STANDARD) {
				standard.file(filename, content);
			}
			else if(selectedType == raidTypes.EVENT) {
				events.file(filename, content);
			}
			else {
				zip.file(filename, content);
			}
		}

		setEvent(currEvent);

		zip.generateAsync({ type: 'blob' })
			.then(function(content) {
				saveAs(content, "event-raids.zip");
				dlCount.innerText = '';
			});
	};

	document.getElementById("btnSaveEvent").onclick = async function () {
		let event = raidsListSelect.value;
		let dlCount = document.getElementById("dlCount");

		let indiv = zip.folder("_indiv");

		dlCount.innerText = `Génération du Zip...`;

		await getRaidData(event);
		setAnchors(event);

		let filename = event.replace(/[/\\?%*:|"<>]/g, '_') + ".txt";
		let content = "[listh]\n";

		for(const raid of encData.filter(enc => enc[infoKeyName].Rate > 0)) {
			await setPokemon(raid[infoKeyName].No);

			let raidName = document.querySelector(`[data-raid-id="${raid[infoKeyName].No}"]`).innerText;
			let indivFilename = raid[infoKeyName].No + "-" + raidName.replace(/[/\\?%*:|"<>]/g, '_') + ".txt";
			indiv.file(indivFilename, textarea.value);

			content += `[item|nostyle]\n${textarea.value}\n[/item]\n`;
		}

		content += "[/listh]";

		zip.file(filename, content);

		setEvent(event);

		zip.generateAsync({ type: 'blob' })
			.then(function(content) {
				saveAs(content, event.replace(/[/\\?%*:|"<>]/g, '_') + ".zip");
				dlCount.innerText = '';
			});
	};
});