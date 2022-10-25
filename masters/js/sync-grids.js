let abilityPanelByTrainer;
let abilities;
let abilityConditions;
let monsterBase;
let monsterInfos;
let monsterNames;
let moveInfos;
let moveNames;
let trainerBase;
let trainerInfos;
let trainerNames;
let passiveSkillName;
let passiveSkillNameParts;
let passiveList;

let abilityType;
let abilityTypeTitle;
let abilityName;
let bgColor;
let condLevel;

let btnCopy;
let table;
let textarea;
let trainerSelect;

function getCellType(ability) {
	switch(ability.type) {
		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
			//stat boosts
			return abilityType[1];
		
		case 7:
			//Passive
			return abilityType[2];
		
		case 8:
			//additional move effect
			return abilityType[3];
		
		case 9:
		case 10:
			//move power/accuracy boost
			if(moveInfos[ability.moveId].group === "Sync") {
				return abilityType[5];
			}
			
			//TODO : Check if it's a sync move, then return abilityType[5]
			return abilityType[4];
	}
}

function getAbilitiesByTrainerID(data) {
	return data.reduce(function (r, a) {
		r[a.trainerId] = r[a.trainerId] || {};
		
		let cellType = getCellType(a.ability);
		
		r[a.trainerId][cellType] = r[a.trainerId][cellType] || [];
		r[a.trainerId][cellType].push(a);
		return r;
	}, {});
}

function getByAbilityID(data) {
	return data.reduce(function (r, a) {
		r[a.abilityId] = r[a.abilityId] || [];
		r[a.abilityId].push(a);
		return r;
	}, {});
}

function getByCondID(data) {
	return data.reduce(function (r, a) {
		r[a.conditionId] = r[a.conditionId] || [];
		r[a.conditionId].push(a);
		return r;
	}, {});
}

function getByMoveID(data) {
	return data.reduce(function (r, a) {
		r[a.moveId] = a;
		return r;
	}, {});
}

function getByMonsterID(data) {
	return data.reduce(function (r, a) {
		r[a.monsterId] = a;
		return r;
	}, {});
}

function getByMonsterBaseID(data) {
	return data.reduce(function (r, a) {
		r[a.monsterBaseId] = a;
		return r;
	}, {});
}

function getByTrainerID(data) {
	return data.reduce(function (r, a) {
		r[a.trainerId] = a;
		return r;
	}, {});
}

function getByID(data) {
	return data.reduce(function (r, a) {
		r[a.id] = a;
		return r;
	}, {});
}

function setConditionsAndAbilities() {
	abilityPanelByTrainer.forEach(abilityPanel => {
		abilityPanel.ability = abilities[abilityPanel.abilityId][0];
		
		abilityPanel.conditionIds.forEach(condId => {
			if(condId >= 12 && condId <= 15)
				abilityPanel.level = condLevel[condId];
		});
		
		abilityPanel.level = abilityPanel.level || "1/5";
	});
	
}

function setPassiveList() {
	
	passiveList = {};
	
	setPassiveNames();
	setPassiveDescriptions();
	
}

function setPassiveNames() {
	let idx = null;
	const digitReplace = "[Name:PassiveSkillNameDigit ]";
	
	Object.keys(passiveSkillName).forEach( id => {
		passiveList[id] = passiveList[id] || {};
	
		var re = /\[Name:PassiveSkillNameParts Idx="(\w+)" \]/gi;
		idx = re.exec(passiveSkillName[id]);
		
		if(idx != null) {
			idx = idx[1];
			passiveList[id].name = passiveSkillNameParts[idx].replace(digitReplace, (id - idx) + "");
		}
		else {
			passiveList[id].name = passiveSkillName[id];
		}
	});
}

function setPassiveDescriptions() {
	let idx = null;
	let descr = "";
	const idTagReplace = '[Name:PassiveSkillDescriptionPartsIdTag Idx=\"{ID}\" ]';
	
	Object.keys(passiveSkillDescription).forEach( id => {
		passiveList[id] = passiveList[id] || {};
		
		var re = /\[Name:PassiveSkillDescriptionPartsIdTag Idx="(\w+)" \]/gi;
		idx = re.exec(passiveSkillDescription[id]);
		
		if(idx != null) {
			descr = passiveSkillDescription[id];
			
			do {
				descr = descr.replace(idTagReplace.replace("{ID}", idx[1]), passiveSkillDescriptionParts[idx[1]]);
			} while((idx = re.exec(descr)) !== null);
			
			passiveList[id].description = descr;
		}
		else {
			passiveList[id].description = passiveSkillDescription[id];
		}
	});
}

async function getData() {
	const [
		abilitiesResponse,
		abilityPanelResponse,
		abilityConditionsResponse,
		monsterResponse,
		monsterBaseResponse,
		moveResponse,
		trainerResponse,
		trainerBaseResponse,
		monsterNameResponse,
		moveNameResponse,
		passiveSkillDescrResponse,
		passiveSDescrPartsResponse,
		passiveSkillNameResponse,
		passiveSNamePartsResponse,
		trainerNameResponse
	] = await Promise.all([
		fetch("./data/proto/Ability.json"),
		fetch("./data/proto/AbilityPanel.json"),
		fetch("./data/proto/AbilityReleaseCondition.json"),
		fetch("./data/proto/Monster.json"),
		fetch("./data/proto/MonsterBase.json"),
		fetch("./data/proto/Move.json"),
		fetch("./data/proto/Trainer.json"),
		fetch("./data/proto/TrainerBase.json"),
		fetch("./data/lsd/monster_name_fr.json"),
		fetch("./data/lsd/move_name_fr.json"),
		fetch("./data/lsd/passive_skill_description_fr.json"),
		fetch("./data/lsd/passive_skill_description_parts_fr.json"),
		fetch("./data/lsd/passive_skill_name_fr.json"),
		fetch("./data/lsd/passive_skill_name_parts_fr.json"),
		fetch("./data/lsd/trainer_name_fr.json")
	])
	.catch(error => console.log(error));
	
	abilityPanelByTrainer = await abilityPanelResponse.json();
	abilityPanelByTrainer = abilityPanelByTrainer.entries;
	
	const abilityConditionsJSON = await abilityConditionsResponse.json();
	abilityConditions = getByCondID(abilityConditionsJSON.entries);
	
	const moveInfosJSON = await moveResponse.json();
	moveInfos = getByMoveID(moveInfosJSON.entries);
	moveNames = await moveNameResponse.json();
	
	passiveSkillDescription = await passiveSkillDescrResponse.json();
	passiveSkillDescriptionParts = await passiveSDescrPartsResponse.json();
	
	passiveSkillName = await passiveSkillNameResponse.json();
	passiveSkillNameParts = await passiveSNamePartsResponse.json();
	
	const abilitiesJSON = await abilitiesResponse.json();
	abilities = getByAbilityID(abilitiesJSON.entries);
	
	const monstersJSON = await monsterResponse.json();
	monsterInfos = getByMonsterID(monstersJSON.entries);
	
	const monstersBaseJSON = await monsterBaseResponse.json();
	monsterBase = getByMonsterBaseID(monstersBaseJSON.entries);
	
	const trainersJSON = await trainerResponse.json();
	trainerInfos = getByTrainerID(trainersJSON.entries);
	
	const trainersBaseJSON = await trainerBaseResponse.json();
	trainerBase = getByID(trainersBaseJSON.entries);
	
	monsterNames = await monsterNameResponse.json();
	trainerNames = await trainerNameResponse.json();
}

async function getCustomJSON() {
	const [
		abilityNameResponse,
		abilityTypeResponse,
		abilityTypeTitleResponse,
		condLevelResponse,
		bgColorResponse
	] = await Promise.all([
		fetch("./data/custom/ability_name.json"),
		fetch("./data/custom/ability_type.json"),
		fetch("./data/custom/ability_type_title.json"),
		fetch("./data/custom/cond_level.json"),
		fetch("./data/custom/table_bgcolor.json")
	])
	.catch(error => console.log(error));
	
	abilityName = await abilityNameResponse.json();
	abilityType = await abilityTypeResponse.json();
	abilityTypeTitle = await abilityTypeTitleResponse.json();
	condLevel = await condLevelResponse.json();
	bgColor = await bgColorResponse.json();
}

function populateSelect() {
	while(trainerSelect.length > 0) {
		trainerSelect.remove(0);
	}
	
	let optionsArray = [];
	
	Object.keys(abilityPanelByTrainer).forEach(trainer => {
		let trainerName = trainerNames[trainerBase[trainerInfos[trainer].trainerBaseId].trainerNameId] || "Dresseur (Scottie/Bettie)";
		let monsterName = monsterNames[monsterBase[monsterInfos[trainerInfos[trainer].monsterId].monsterBaseId].monsterNameId];
		
		let option = {};
		option.value = trainer;
		option.text = `${trainerName} & ${monsterName}`;
		
		optionsArray.push(option);
	});
	
	optionsArray.sort((a, b) => a.text.localeCompare(b.text));
	
	optionsArray.forEach(opt => {
		trainerSelect.add(new Option(opt.text, opt.value));
	});
}

function sortSelect() {
	let tmpArray = [];
	for(let i = 0; i < trainerSelect.options.length; i++) {
		tmpArray[i] = {};
		tmpArray[i].text = trainerSelect.options[i].text;
		tmpArray[i].value = trainerSelect.options[i].value;
	}
	
	tmpArray.sort((a, b) => a.text.localeCompare(b.text));
	
	while(trainerSelect.options.length > 0) {
		trainerSelect.options[0] = null;
	}
	
	for(let i = 0; i < tmpArray.length; i++) {
		let op = new Option(tmpArray[i].text, tmpArray[i].value);
		trainerSelect.options[i] = op;
	}
}

function sortCells() {
	Object.keys(abilityPanelByTrainer).forEach(trainer => {
		Object.keys(abilityPanelByTrainer[trainer]).forEach(boost => {
			abilityPanelByTrainer[trainer][boost].sort((a, b) => a.level.localeCompare(b.level) || a.cellId - b.cellId);
		});
	});
}

function getReplacedText(text, ability) {
	text = text.replace("{val}", ability.value);
	if(ability.passiveId != 0)
		text = text.replace("{passive}", passiveList[ability.passiveId].name);
	if(ability.moveId != 0)
		text = text.replace("{move}", moveNames[ability.moveId].replace("\n", " "));
		
	return text;
}

function setTrainer(id) {
	table.innerHTML = "";
	table.innerHTML += "<tr><th>Amélioration</th><th>Effet</th><th>Énergie requise</th><th>Duo-Sphères requises</th><th>Niveau des Capacités requis</th></tr>\n";
	
	textarea.value = "[center][table]\n[tr][th|width=250px]Amélioration[/th][th|width=300px]Effet[/th][th|width=100px]Énergie requise[/th][th|width=100px]Duo-Sphères requises[/th][th|width=100px]Niveau des Capacités requis[/th][/tr]\n";
	
	appendCategory(abilityPanelByTrainer[id], "StatsBoost");
	appendCategory(abilityPanelByTrainer[id], "MovePowerAccuracyBoost");
	appendCategory(abilityPanelByTrainer[id], "AdditionalMoveEffect");
	appendCategory(abilityPanelByTrainer[id], "Passive");
	appendCategory(abilityPanelByTrainer[id], "SyncMove");
	
	textarea.value += "[/table][/center]";
}

function getCleanDescr(descr, level) {
	descr = descr.replaceAll(/\[Digit:2digits \]\s%/gi, ((level+1) * 10 + "") + " %");
	descr = descr.replaceAll(/\[Digit:1digit \]/gi, level + "");
	descr = descr.replaceAll("\n", " ");
	
	const matches = [...descr.matchAll(/\[FR:Qty\sS=\"(\w+)\"\sP=\"(\w+)\"\s\]/gi)];
	
	if(matches.length > 0) {
		matches.forEach(match => {
			descr = descr.replace(/\[FR:Qty\sS=\"\w+\"\sP=\"\w+\"\s\]/gi, (level > 1 ? match[2] : match[1]));
		});
	}
	
	return descr;
}

function appendCategory(trainer, category) {
	
	if(typeof trainer[category] === 'undefined') {
		return;
	}
	
	table.innerHTML += "<tr><th style='background-color:" + bgColor[category] + ";' colspan=5>" + abilityTypeTitle[category] + "</th></tr>\n";
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
	
		table.innerHTML += "<tr><td>" + amelioration
			+ "</td><td>" + passiveDescr
			+ "</td><td>" + (cell.energyCost == 0 ? '-' : cell.energyCost)
			+ "</td><td>" + cell.orbCost
			+ "</td><td>" + cell.level
			+ "</td></tr>\n";
		
		textarea.value += "\t[tr]\n\t[td]" + amelioration
			+ "[/td]\n\t[td]" + passiveDescr
			+ "[/td]\n\t[td]" + (cell.energyCost == 0 ? '-' : cell.energyCost)
			+ "[/td]\n\t[td]" + cell.orbCost + " [img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/duo-sphere.png[/img]"
			+ "[/td]\n\t[td][img]/pages/jeuxvideo/pokemon-masters/images/plateau-duo-gemme/niveau-capacites-" + cell.level.charAt(0) + ".png[/img]"
			+ "[/td]\n\t[/tr]\n"
	});
}

function setUrlTID(value) {
	const url = new URL(window.location);
	url.searchParams.set('trainerId', value);
	window.history.pushState(null, '', url.toString());
}

async function init() {
	await getData();
	await getCustomJSON();
	
	btnCopy = document.getElementById("btnCopy");
	table = document.getElementById("table");
	textarea = document.getElementById("area");
	trainerSelect = document.getElementById("trainersList");
	
	setPassiveList();
	setConditionsAndAbilities();
	
	abilityPanelByTrainer = getAbilitiesByTrainerID(abilityPanelByTrainer);
	sortCells();
	
	populateSelect();
	
	btnCopy.onclick = function() {
		navigator.clipboard.writeText(textarea.value);
	};
	
	trainerSelect.onchange = function() {
		setUrlTID(trainerSelect.value);
		setTrainer(trainerSelect.value);
	};

	const urlTID = new URL(window.location).searchParams.get('trainerId');

	if(urlTID !== null) {

		let i = 0;
		for(const opt of trainerSelect.options) {
			if(urlTID === opt.value) {
				trainerSelect.selectedIndex = i;
				break;
			}
			i++;
		}
	}

	setTrainer(trainerSelect.value);
}

init();