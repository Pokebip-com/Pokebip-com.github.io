let abilityPanelByTrainer;
let abilities;
let abilityConditions;
let monsterBase;
let monsterEvolution;
let monsterInfos;
let monsterNames;
let moveInfos;
let moveNames;
let movePassiveDigit;
let tagNames;
let trainerBase;
let trainerInfos;
let trainerNames;
let lastUpdateGrids;
let passiveSkillDescription;
let passiveSkillDescriptionParts;
let passiveSkillName;
let passiveSkillNameParts;
let passiveList;

let abilityType;
let abilityTypeTitle;
let abilityName;
let bgColor;
let condLevel;

let btnCopy;
let statsTable;
let gridTable;
let textarea;
let trainerSelect;
let updatedGridsSpan;

let zip = new JSZip();

const replace_nth = function(s, f, r, n) {
	// From the given string s, find f, replace as r only on n’th occurrence
	return s.replace(RegExp("^(?:.*?" + f + "){" + n + "}"), x => x.replace(RegExp(f + "$"), r));
};

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

			return abilityType[4];
	}
}

function getAbilitiesByTrainerID(data) {
	return data.reduce(function (r, a) {
		r[a.trainerId] = r[a.trainerId] || {};

		r[a.trainerId].nbCells = r[a.trainerId].nbCells + 1 || 1;

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

function getEvolutionByTrainerId(data) {
	return data.reduce(function (r, a) {
		r[a.trainerId] = r[a.trainerId] || [];
		r[a.trainerId][a.monsterIdCurrent] = a;
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
	console.log(abilities);
	console.log(abilityPanelByTrainer);
	abilityPanelByTrainer.forEach(abilityPanel => {
		console.log(abilityPanel);


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
	
		var re = /\[Name:PassiveSkillNameParts Idx="(\w+)" ]/gi;
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
		
		var re = /\[Name:PassiveSkillDescriptionPartsIdTag Idx="(\w+)" ]/gi;
		idx = re.exec(passiveSkillDescription[id]);
		
		if(idx != null) {
			descr = passiveSkillDescription[id];
			
			do {
				descr = descr.replace(idTagReplace.replace("{ID}", idx[1]), getSkillMoveDescr(passiveSkillDescriptionParts[idx[1]], id));
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
		monsterEvolutionResponse,
		moveResponse,
		movePassiveSkillDigitResponse,
		trainerResponse,
		trainerBaseResponse,
		monsterNameResponse,
		moveNameResponse,
		passiveSkillDescrResponse,
		passiveSDescrPartsResponse,
		passiveSkillNameResponse,
		passiveSNamePartsResponse,
		tagNameResponse,
		trainerNameResponse
	] = await Promise.all([
		fetch("./data/proto/Ability.json"),
		fetch("./data/proto/AbilityPanel.json"),
		fetch("./data/proto/AbilityReleaseCondition.json"),
		fetch("./data/proto/Monster.json"),
		fetch("./data/proto/MonsterBase.json"),
		fetch("./data/proto/MonsterEvolution.json"),
		fetch("./data/proto/Move.json"),
		fetch("./data/proto/MoveAndPassiveSkillDigit.json"),
		fetch("./data/proto/Trainer.json"),
		fetch("./data/proto/TrainerBase.json"),
		fetch("./data/lsd/monster_name_fr.json"),
		fetch("./data/lsd/move_name_fr.json"),
		fetch("./data/lsd/passive_skill_description_fr.json"),
		fetch("./data/lsd/passive_skill_description_parts_fr.json"),
		fetch("./data/lsd/passive_skill_name_fr.json"),
		fetch("./data/lsd/passive_skill_name_parts_fr.json"),
		fetch("./data/lsd/tag_name_with_prepositions_fr.json"),
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
	tagNames = await tagNameResponse.json();

	const movePassiveSkillDigitJSON = await movePassiveSkillDigitResponse.json();
	movePassiveDigit = getByID(movePassiveSkillDigitJSON.entries);
	
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

	const monsterEvolutionJSON = await monsterEvolutionResponse.json();
	monsterEvolution = getEvolutionByTrainerId(monsterEvolutionJSON.entries);
	
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
		lastUpdateGridsResponse,
		condLevelResponse,
		bgColorResponse
	] = await Promise.all([
		fetch("./data/custom/ability_name.json"),
		fetch("./data/custom/ability_type.json"),
		fetch("./data/custom/ability_type_title.json"),
		fetch("./data/custom/last_update_grids.json"),
		fetch("./data/custom/cond_level.json"),
		fetch("./data/custom/table_bgcolor.json")
	])
	.catch(error => console.log(error));
	
	abilityName = await abilityNameResponse.json();
	abilityType = await abilityTypeResponse.json();
	abilityTypeTitle = await abilityTypeTitleResponse.json();
	lastUpdateGrids = await lastUpdateGridsResponse.json();
	condLevel = await condLevelResponse.json();
	bgColor = await bgColorResponse.json();
}

function checkIfNew(trainerId) {
	if(abilityPanelByTrainer[trainerId].oldNbCells !== abilityPanelByTrainer[trainerId].nbCells) {
		let anchor = document.createElement('a');
		anchor.href = '#';
		anchor.textContent = `${getTrainerName(trainerId)} & ${getMonsterNameByTrainerId(trainerId)} (${abilityPanelByTrainer[trainerId].oldNbCells} -> ${abilityPanelByTrainer[trainerId].nbCells})`;

		anchor.onclick = function() {
			const url = new URL(window.location);
			url.searchParams.set('trainerId', trainerId);
			window.history.pushState(null, '', url.toString());
			setTrainer(trainerId);
		};

		if(updatedGridsSpan.children.length === 0) {
			updatedGridsSpan.innerHTML = "<b>Plateaux mis à jour :</b>";
		}

		updatedGridsSpan.appendChild(document.createElement("br"));
		updatedGridsSpan.appendChild(anchor);
	}
}

function getTrainerName(id) {
	return trainerNames[trainerBase[trainerInfos[id].trainerBaseId].trainerNameId] || "Dresseur (Scottie/Bettie)";
}

function getMonsterNameByTrainerId(id) {
	return monsterNames[monsterBase[monsterInfos[trainerInfos[id].monsterId].monsterBaseId].monsterNameId];
}

function populateSelect() {
	while(trainerSelect.length > 0) {
		trainerSelect.remove(0);
	}
	
	let optionsArray = [];
	updatedGridsSpan.innerText = "";
	
	Object.keys(abilityPanelByTrainer).forEach(trainer => {
		let trainerName = getTrainerName(trainer);
		let monsterName = getMonsterNameByTrainerId(trainer);
		
		let option = {};
		option.value = trainer;
		option.text = `${trainerName} & ${monsterName}`;
		
		optionsArray.push(option);

		checkIfNew(trainer);
	});
	
	optionsArray.sort((a, b) => a.text.localeCompare(b.text));
	
	optionsArray.forEach(opt => {
		trainerSelect.add(new Option(opt.text, opt.value));
	});
}

function sortCells() {
	Object.keys(abilityPanelByTrainer).forEach(trainer => {
		Object.keys(abilityPanelByTrainer[trainer]).forEach(boost => {
			if(Array.isArray(abilityPanelByTrainer[trainer][boost])) {
				abilityPanelByTrainer[trainer][boost].sort((a, b) => a.level.localeCompare(b.level) || a.cellId - b.cellId);
			}
		});
	});
}

function getReplacedText(text, ability) {
	text = text.replace("{val}", ability.value);
	if(ability.passiveId !== 0)
		text = text.replace("{passive}", passiveList[ability.passiveId].name);
	if(ability.moveId !== 0)
		text = text.replace("{move}", moveNames[ability.moveId].replace("\n", " "));
		
	return text;
}

function setStats(id) {
	statsTable.innerHTML = "";
	console.log(trainerInfos[id]);
	console.log(monsterInfos[trainerInfos[id].monsterId]);
	console.log(monsterEvolution);
	console.log(id);
	console.log(monsterEvolution[id][trainerInfos[id].monsterId]);
	console.log(monsterInfos[monsterEvolution[id][trainerInfos[id].monsterId].monsterIdNext]);

}

function setGrid(id) {
	gridTable.innerHTML = "";
	gridTable.innerHTML += "<thead><tr><th>Amélioration</th><th>Effet</th><th>Énergie requise</th><th>Duo-Sphères requises</th><th>Niveau des Capacités requis</th></tr></thead>\n";

	textarea.value = "[center][table]\n[tr][th|width=250px]Amélioration[/th][th|width=300px]Effet[/th][th|width=100px]Énergie requise[/th][th|width=100px]Duo-Sphères requises[/th][th|width=100px]Niveau des Capacités requis[/th][/tr]\n";

	appendCategory(abilityPanelByTrainer[id], "StatsBoost");
	appendCategory(abilityPanelByTrainer[id], "MovePowerAccuracyBoost");
	appendCategory(abilityPanelByTrainer[id], "AdditionalMoveEffect");
	appendCategory(abilityPanelByTrainer[id], "Passive");
	appendCategory(abilityPanelByTrainer[id], "SyncMove");

	textarea.value += "[/table][/center]";

	document.getElementById("nbCells").innerText = abilityPanelByTrainer[id].nbCells;
}

function setTrainer(id) {
	//setStats(id);
	setGrid(id);
	trainerSelect.value = id;
}

function getMovePassiveDigitTags(id) {
	tags = {};

	if(typeof movePassiveDigit[id] === "undefined") {
		return tags;
	}

	for(let i = 1; i <= 20; i +=2) {
		switch(movePassiveDigit[id][`param${i}`]) {
			case "1":
				if(typeof tags["Digit"] === "undefined") {
					tags["Digit"] = {};
				}
				const digit = movePassiveDigit[id][`param${i+1}`];
				const digitName = digit.length + "digit" + (digit.length > 1 ? "s" : "");

				if(typeof tags["Digit"][digitName] === "undefined") {
					tags["Digit"][digitName] = [];
				}

				tags["Digit"][digitName].push(digit);
				break;

			case "2":
				if(typeof tags["Name"] === "undefined") {
					tags["Name"] = {
						"ReferencedMessageTag": []
					};
				}

				tags["Name"]["ReferencedMessageTag"].push(tagNames[movePassiveDigit[id][`param${i+1}`]]);
				break;
		}
	}

	return tags;
}

function getArgumentValue(string, argText) {
	let startIndex = string.indexOf(`${argText}="`);

	if(startIndex === -1) {
		return "";
	}

	startIndex += `${argText}="`.length;

	const endIndex = startIndex + string.substring(startIndex).indexOf(`"`);

	return string.substring(startIndex, endIndex);
}

function getSkillMoveDescr(descr, id) {
	let tags = getMovePassiveDigitTags(id);

	let lastQty = 0;
	let lastValue = "";
	let lastName = "";

	let Idx = [];

	while(descr.indexOf("[") !== -1) {
		const indexOpen = descr.indexOf("[");
		const indexClose = descr.indexOf("]");

		const substring = descr.substring(indexOpen, indexClose + 1);

		const indexColon = indexOpen + substring.indexOf(":");
		const indexSubstrSpace = indexOpen + substring.indexOf(" ");

		const tagType = descr.substring(indexOpen + 1, indexColon);
		const tagValue = descr.substring(indexColon + 1, indexSubstrSpace);

		const idxValue = getArgumentValue(descr, "Idx");
		const refValue = getArgumentValue(descr, "Ref");

		const singularValue = getArgumentValue(descr, "S");
		const pluralValue = getArgumentValue(descr, "P");

		if(idxValue.length > 0) {
			Idx.push(idxValue);
		}

		if(tagType === "FR") {
			let qtyRef = lastQty;

			if(refValue.length > 0) {
				qtyRef = Idx[refValue];
			}

			let replaceStr = singularValue;

			if(qtyRef > 1) {
				replaceStr = pluralValue;
			}

			descr = descr.replace(substring, replaceStr);
		}
		else if(tagType === "Name" && tagValue === "MoveId") {
			descr = descr.replace(substring, moveNames[idxValue].replace("\n", " "));
			Idx.pop();
		}
		else if(tags[tagType][tagValue].length > 0) {
			lastValue = tags[tagType][tagValue].shift();
			descr = descr.replace(substring, lastValue);
		}
		else if(tagType === "Name") {
			lastValue = lastName;
			descr = descr.replace(substring, lastValue);
		}
		else {//*
			if(tagType === "Digit") {
				lastValue = lastQty;
			}
			else if(tagType === "Name") {
				lastValue = lastName;
			}
			descr = descr.replace(substring, lastValue);
			//*/
		}

		if(tagType === "Digit") {
			lastQty = lastValue;
		}
		else if(tagType === "Name") {
			lastName = lastValue;
		}

	}

	return descr;
}

function outlineBrackets(descr) {
	// Met les balises restantes en gras souligné sur l'aperçu
	return descr.replaceAll(/\[/gi, "<span style='color:yellowgreen;'><strong><u>[")
		.replaceAll(/]/gi, "]</u></strong></span>");
}

function appendCategory(trainer, category) {
	
	if(typeof trainer[category] === 'undefined') {
		return;
	}
	
	gridTable.innerHTML += "<tr><th style='background-color:" + bgColor[category] + ";' colspan=5>" + abilityTypeTitle[category] + "</th></tr>\n";
	textarea.value += "\t[tr][th|bgcolor=" + bgColor[category] + "|colspan=5]" + abilityTypeTitle[category] + "[/th][/tr]\n"

	trainer[category].forEach(cell => {
		let amelioration = getReplacedText(abilityName[cell.ability.type], cell.ability);
		let passiveDescr = '-';
		
		if(cell.ability.passiveId !== 0) {
			passiveDescr = passiveList[cell.ability.passiveId].description;
		}

		// console.log(`CellID - trainerID : ${cell.cellId-cell.trainerId/10}\noldNbCells : ${trainer.oldNbCells}\nIsBigger? ${((cell.cellId - cell.trainerId/10) >= trainer.oldNbCells) ? "true" : "false"}`);

	
		gridTable.innerHTML += `<tr${((cell.cellId - cell.trainerId/10) >= trainer.oldNbCells) ? " style='background-color:#7afa96;'" : " style=''"}>`
			+ "<td>" + amelioration
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

function setUrlTID(value) {
	const url = new URL(window.location);
	url.searchParams.set('trainerId', value);
	window.history.pushState(null, '', url.toString());
}

async function init() {
	await getData();
	await getCustomJSON();
	
	btnCopy = document.getElementById("btnCopy");
	gridTable = document.getElementById("gridTable");
	statsTable = document.getElementById("statsTable");
	textarea = document.getElementById("area");
	trainerSelect = document.getElementById("trainersList");
	updatedGridsSpan = document.getElementById("updatedGrids");
	
	setPassiveList();
	setConditionsAndAbilities();
	
	abilityPanelByTrainer = getAbilitiesByTrainerID(abilityPanelByTrainer);

	Object.keys(abilityPanelByTrainer).forEach(trainerID => {
		abilityPanelByTrainer[trainerID].oldNbCells = lastUpdateGrids[trainerID] || 0;
	});

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
		trainerSelect.value = urlTID;
	}

	setTrainer(trainerSelect.value);
}

init().then(() => {
	document.getElementById("btnSave").onclick = function () {
		let currTrainer = trainerSelect.value;
		let dlCount = document.getElementById("dlCount");
		let i = 1;

		for(const opt of trainerSelect.options) {
			dlCount.innerText = `Génération du fichier no ${i}/${trainerSelect.options.length}...`;
			setTrainer(opt.value);
			let filename = opt.text.replace(/[/\\?%*:|"<>]/g, '_') + ".txt";
			zip.file(filename, textarea.value);
		}

		setTrainer(currTrainer);
		dlCount.innerText = `Génération du zip...`;

		zip.generateAsync({ type: 'blob' })
			.then(function(content) {
				saveAs(content, "Duos.zip");
				dlCount.innerText = '';
			});
	};
});