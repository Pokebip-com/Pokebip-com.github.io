async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("Battle");
    jsonCache.preloadProto("BattleChampionTheme");
    jsonCache.preloadProto("BattleNpcUnit");
    jsonCache.preloadProto("BattleParameter");
    jsonCache.preloadProto("EnemyOverwriteParameter");
    jsonCache.preloadProto("EventQuestGroup");
    jsonCache.preloadProto("GvG");
    jsonCache.preloadProto("GvGBoss");
    jsonCache.preloadProto("GvGBossRound");
    jsonCache.preloadProto("GvGEnemyOverwrite");
    jsonCache.preloadProto("GvGRound");
    jsonCache.preloadProto("MonsterBase");
    jsonCache.preloadProto("StoryQuest");
    jsonCache.preloadProto("StoryQuestDetail");
    jsonCache.preloadProto("TrainerBase");

    // LSD
    jsonCache.preloadLsd("abnormal_state");
    jsonCache.preloadLsd("banner_text");
    jsonCache.preloadLsd("champion_battle_theme");
    jsonCache.preloadLsd("monster_name");
    jsonCache.preloadLsd("motif_type_name");
    jsonCache.preloadLsd("story_quest_name");

    // Other Preloads
    preloadUtils();
    preloadMovePassiveSkills();

    await jsonCache.runPreload();
}

printEnemyOverwriteParameters = (enemyOverwriteParameterId, tr) => {
    let params = jData.proto.enemyOverwriteParameter.find(eop => eop.enemyOverwriteParameterId.toString() === enemyOverwriteParameterId.toString());

    let hp = document.createElement("td");
    hp.innerText = params.hp;
    tr.appendChild(hp);

    let atk = document.createElement("td");
    atk.innerText = params.atk;
    tr.appendChild(atk);

    let def = document.createElement("td");
    def.innerText = params.def;
    tr.appendChild(def);

    let spa = document.createElement("td");
    spa.innerText = params.spa;
    tr.appendChild(spa);

    let spd = document.createElement("td");
    spd.innerText = params.spd;
    tr.appendChild(spd);

    let spe = document.createElement("td");
    spe.innerText = params.spe;
    tr.appendChild(spe);

    return tr;
}

printEnemies = (enemyIds, battleParams) => {
    let div = document.createElement("div");

    let npcs = [];

    npcs.push(jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId1));
    npcs.push(jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId2));
    npcs.push(jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId3));

    for(let i = 0; i < npcs.length; i++) {
        let npc = npcs[i];
        let isCenter = i === 0;
        let enemyId = enemyIds[isCenter ? 0 : 1];
        const enemyType = isCenter ? "Center" : "Side";
        let enemy = jData.proto.gvGEnemyOverwrite.find(e => e.gvgEnemyOverwriteId.toString() === enemyId.toString());
        let monster = jData.proto.monsterBase.find(mb => mb.actorId === npc.monsterActorId);
        const monsterName = jData.lsd.monsterName[monster.monsterNameId];

        console.log(npc);

        let h2 = document.createElement("h2");
        h2.innerText = `${monsterName} (${enemyType})`;
        div.appendChild(h2);

        let h3 = document.createElement("h3");
        h3.innerText = "Moves"
        div.appendChild(h3);

        let table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        let thead = document.createElement("thead");
        let tr = document.createElement("tr");

        let emptyTh = document.createElement("th");
        emptyTh.innerText = "";
        tr.appendChild(emptyTh);

        let moveNameTh = document.createElement("th");
        moveNameTh.innerText = "Move";
        tr.appendChild(moveNameTh);

        let moveDescrTh = document.createElement("th");
        moveDescrTh.innerText = "Description";
        tr.appendChild(moveDescrTh);

        let moveUsessTh = document.createElement("th");
        moveUsessTh.innerText = "Uses";
        tr.appendChild(moveUsessTh);

        thead.appendChild(tr);

        let tbody = document.createElement("tbody");

        let moveNum = 0;

        for(let i = 1; i <= 6; i++) {
            let moveId = npc[`move${i}Id`];

            if(moveId === -1) continue;

            moveNum++;

            let uses = npc[`move${i}Uses`];

            tr = document.createElement("tr");

            let moveNumTh = document.createElement("th");
            moveNumTh.innerText = moveNum;
            tr.appendChild(moveNumTh);

            let moveNameTd = document.createElement("td");
            moveNameTd.innerText = jData.lsd.moveName[moveId];
            tr.appendChild(moveNameTd);

            let moveDescrTd = document.createElement("td");
            moveDescrTd.innerText = getMoveDescr(moveId);
            tr.appendChild(moveDescrTd);

            let moveUsesTd = document.createElement("td");
            moveUsesTd.innerText = uses;
            tr.appendChild(moveUsesTd);

            tbody.appendChild(tr);
        }

        if(npc.syncMoveId !== -1) {
            tr = document.createElement("tr");

            let moveNumTh = document.createElement("th");
            moveNumTh.innerText = "Sync";
            tr.appendChild(moveNumTh);

            let moveNameTd = document.createElement("td");
            moveNameTd.innerText = jData.lsd.moveName[npc.syncMoveId];
            tr.appendChild(moveNameTd);

            let moveDescrTd = document.createElement("td");
            moveDescrTd.innerText = getMoveDescr(npc.syncMoveId);
            tr.appendChild(moveDescrTd);

            let moveUsesTd = document.createElement("td");
            moveUsesTd.innerText = "-";
            tr.appendChild(moveUsesTd);

            tbody.appendChild(tr);
        }

        table.appendChild(thead);
        table.appendChild(tbody);

        div.appendChild(table);

        h3 = document.createElement("h3");
        h3.innerText = "Passives"
        div.appendChild(h3);

        table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        thead = document.createElement("thead");
        tr = document.createElement("tr");

        emptyTh = document.createElement("th");
        emptyTh.innerText = "";
        tr.appendChild(emptyTh);

        let passiveName = document.createElement("th");
        passiveName.innerText = "Passive Name";
        tr.appendChild(passiveName);

        let passiveDescr = document.createElement("th");
        passiveDescr.innerText = "Description";
        tr.appendChild(passiveDescr);

        thead.appendChild(tr);
        tbody = document.createElement("tbody");

        let passiveNum = 0;

        for(let i = 1; i <= 20; i++) {
            let passiveId = npc[`passive${i}Id`];
            if(passiveId === 0) continue;

            passiveNum++;

            tr = document.createElement("tr");
            let passiveNumTh = document.createElement("th");
            passiveNumTh.innerText = passiveNum;
            tr.appendChild(passiveNumTh);

            let passiveNameTd = document.createElement("td");
            passiveNameTd.innerHTML = getDetailedPassiveSkillName(passiveId) ?? "-";
            tr.appendChild(passiveNameTd);

            let passiveDescrTd = document.createElement("td");
            passiveDescrTd.innerText = getPassiveSkillDescr(passiveId) ?? "-";
            tr.appendChild(passiveDescrTd);

            tbody.appendChild(tr);
        }

        table.appendChild(thead);
        table.appendChild(tbody);

        div.appendChild(table);

        h3 = document.createElement("h3");
        h3.innerText = "Enemy Overwrite Params"
        div.appendChild(h3);

        table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        thead = document.createElement("thead");
        tr = document.createElement("tr");

        let passive1IdTh = document.createElement("th");
        passive1IdTh.innerText = "passive1";
        tr.appendChild(passive1IdTh);

        let passive2IdTh = document.createElement("th");
        passive2IdTh.innerText = "passive2";
        tr.appendChild(passive2IdTh);

        let passive3IdTh = document.createElement("th");
        passive3IdTh.innerText = "passive3";
        tr.appendChild(passive3IdTh);

        let hpTh = document.createElement("th");
        hpTh.innerText = "HP";
        tr.appendChild(hpTh);

        let atkTh = document.createElement("th");
        atkTh.innerText = "ATK";
        tr.appendChild(atkTh);

        let defTh = document.createElement("th");
        defTh.innerText = "DEF";
        tr.appendChild(defTh);

        let spaTh = document.createElement("th");
        spaTh.innerText = "SPA";
        tr.appendChild(spaTh);

        let spdTh = document.createElement("th");
        spdTh.innerText = "SPD";
        tr.appendChild(spdTh);

        let speTh = document.createElement("th");
        speTh.innerText = "SPE";
        tr.appendChild(speTh);

        let weaknessTh = document.createElement("th");
        weaknessTh.innerText = "weakness";
        tr.appendChild(weaknessTh);

        let watchOutOnTheseTh = document.createElement("th");
        watchOutOnTheseTh.innerText = "Watch out";
        tr.appendChild(watchOutOnTheseTh);

        let focusOnTheseTh = document.createElement("th");
        focusOnTheseTh.innerText = "Focus";
        tr.appendChild(focusOnTheseTh);
        thead.appendChild(tr);

        tbody = document.createElement("tbody");

        tr = document.createElement("tr");

        let passive1IdTd = document.createElement("td");
        if(getPassiveSkillName(enemy.passive1Id) === undefined) passive1IdTd.innerHTML = "-";
        else {
            let container = document.createElement("span");
            container.classList.add("custom-tooltip-container");

            let trigger = document.createElement("span");
            trigger.classList.add("custom-tooltip-trigger");
            trigger.innerHTML = getPassiveSkillName(enemy.passive1Id);
            container.appendChild(trigger);

            let tooltip = document.createElement("span");
            tooltip.classList.add("custom-tooltip-text");
            tooltip.innerHTML = getPassiveSkillDescr(enemy.passive1Id);
            container.appendChild(tooltip);

            passive1IdTd.innerHTML = container.outerHTML;
        }
        tr.appendChild(passive1IdTd);

        let passive2IdTd = document.createElement("td");
        if(getPassiveSkillName(enemy.passive2Id) === undefined) passive2IdTd.innerHTML = "-";
        else {
            let container = document.createElement("span");
            container.classList.add("custom-tooltip-container");

            let trigger = document.createElement("span");
            trigger.classList.add("custom-tooltip-trigger");
            trigger.innerHTML = getPassiveSkillName(enemy.passive2Id);
            container.appendChild(trigger);

            let tooltip = document.createElement("span");
            tooltip.classList.add("custom-tooltip-text");
            tooltip.innerHTML = getPassiveSkillDescr(enemy.passive2Id);
            container.appendChild(tooltip);

            passive2IdTd.innerHTML = container.outerHTML;
        }
        tr.appendChild(passive2IdTd);

        let passive3IdTd = document.createElement("td");
        if(getPassiveSkillName(enemy.passive3Id) === undefined) passive3IdTd.innerHTML = "-";
        else {
            let container = document.createElement("span");
            container.classList.add("custom-tooltip-container");

            let trigger = document.createElement("span");
            trigger.classList.add("custom-tooltip-trigger");
            trigger.innerHTML = getPassiveSkillName(enemy.passive3Id);
            container.appendChild(trigger);

            let tooltip = document.createElement("span");
            tooltip.classList.add("custom-tooltip-text");
            tooltip.innerHTML = getPassiveSkillDescr(enemy.passive3Id);
            container.appendChild(tooltip);

            passive3IdTd.innerHTML = container.outerHTML;
        }
        tr.appendChild(passive3IdTd);

        tr = printEnemyOverwriteParameters(enemy.enemyOverwriteParameterId, tr);

        let weaknessTd = document.createElement("td");
        weaknessTd.innerText = jData.lsd.motifTypeName[enemy.weakness];
        tr.appendChild(weaknessTd);

        let watchOutTd = document.createElement("td");
        for(let i = 1; i <= 3; i++) {
            if(enemy[`abnormalStateWatchOut${i}`] !== "-1") {
                watchOutTd.innerText !== "" ? watchOutTd.innerText += ", " : "";
                watchOutTd.innerText += jData.lsd.abnormalState[enemy[`abnormalStateWatchOut${i}`]];
            }
        }
        watchOutTd.innerText = watchOutTd.innerText.length > 0 ? watchOutTd.innerText : "-";
        tr.appendChild(watchOutTd);

        let focusOnTheseTd = document.createElement("td");
        for(let i = 1; i <= 2; i++) {
            if(enemy[`abnormalStateFocus${i}`] !== "-1") {
                focusOnTheseTd.innerText !== "" ? focusOnTheseTd.innerText += ", " : "";
                focusOnTheseTd.innerText += jData.lsd.abnormalState[enemy[`abnormalStateFocus${i}`]];
            }
        }

        focusOnTheseTd.innerText = focusOnTheseTd.innerText.length > 0 ? focusOnTheseTd.innerText : "-";
        tr.appendChild(focusOnTheseTd);

        tbody.appendChild(tr);

        table.appendChild(thead);
        table.appendChild(tbody);

        table.style.width = "100%";
        table.style.maxWidth = "100%";
        table.style.tableLayout = "fixed";

        div.appendChild(table);
        div.appendChild(document.createElement("br"));
    }

    div.appendChild(document.createElement("hr"));

    return div;
}

printRound = (roundId, themeId, roundNum) => {
    let div = document.createElement("div");
    div.id = roundId;

    const bossRound = jData.proto.gvGBossRound.find(br => br.gvgBossRoundId.toString() === roundId.toString());
    const storyQuest = jData.proto.storyQuest.find(sq => sq.storyQuestId.toString() === bossRound.storyQuestId.toString());
    const storyQuestDetail = jData.proto.storyQuestDetail.find(sqd => sqd.storyQuestId.toString() === storyQuest.storyQuestId.toString());
    const questName = jData.lsd.storyQuestName[storyQuest.questNameId];
    const battle = jData.proto.battle.find(b => b.battleId === storyQuestDetail.battleIds[0]);
    const battleParams = jData.proto.battleParameter.find(bp => bp.battleParameterId === battle.battleParameterId);

    let h4 = document.createElement("h4");
    h4.innerHTML = `Cycle ${roundNum} - ${questName} (${roundId})`;
    div.appendChild(h4);

    if(themeId.length > 0 && !themeId.includes("0")) {
        div.innerHTML += `<b>Restriction :</b><br />`;
        if(themeId.length > 1) {
            div.innerHTML += "Cycle (dans l'ordre) parmi :<br />";
        }
        for(let i = 0; i < themeId.length; i++) {
            const theme = jData.proto.battleChampionTheme.find(bt => themeId[i].toString() === bt.battleChampionThemeId.toString());
            div.innerHTML += `- ${jData.lsd.championBattleTheme[theme.championBattleThemeName]}<br />`;
        }
        div.innerHTML += `<br />`;
    }

    if(storyQuestDetail.weakTypes.length > 0) {
        div.innerHTML += `<b>Faiblesse :</b> ${storyQuestDetail.weakTypes.map(t => jData.lsd.motifTypeName[t]).join(", ")}<br /><br />`;
    }


    div.appendChild(printEnemies(bossRound.gvgEnemyOverwriteIds, battleParams));

    return div;
}

printBoss = (bossId, bossListDiv) => {

    let boss = jData.proto.gvGBoss.find(b => b.gvgBossId.toString() === bossId);

    let span = document.createElement("span");
    let a = document.createElement("a");
    a.innerText = getTrainerNameByActorId(boss.actorId);
    a.style.fontWeight = "bold";
    a.href = `#${bossId}`;
    span.appendChild(a);
    span.innerHTML += `<br />`;
    bossListDiv.appendChild(span);

    let cyclesDiv = document.createElement("div");
    cyclesDiv.setAttribute("listSpan", "true");
    let i = 1;

    [...boss.gvgBossRoundIds, boss.gvgBossRoundRepeatedId].forEach(roundId => {
        let span = document.createElement("span");
        let a = document.createElement("a");
        a.innerText = `Cycle ${i++} - Round ID: ${roundId}`;
        a.style.fontWeight = "bold";
        a.href = `#${roundId}`;
        span.appendChild(a);
        span.innerHTML += `<br />`;
        cyclesDiv.appendChild(span);
    })

    let div = document.createElement("div");
    let h3 = document.createElement("h3");
    h3.innerText = `${boss.gvgBossId} - ${getTrainerNameByActorId(boss.actorId)}`;
    h3.id = bossId;
    div.appendChild(h3);

    div.innerHTML += `<b>Type :</b> ${jData.lsd.motifTypeName[boss.type]}<br /><br />`;

    div.appendChild(cyclesDiv);

    for(let i = 0; i < boss.gvgBossRoundIds.length + 1; i++) {
        if(i === boss.gvgBossRoundIds.length) {
            div.appendChild(printRound(boss.gvgBossRoundRepeatedId, boss.repeatedRoundBattleChampionThemeIds, (i+1)));
        } else {
            div.appendChild(printRound(boss.gvgBossRoundIds[i], [boss.roundsBattleChampionThemeIds[i]], (i+1)));
        }
    }

    return div;
}

printGvG = (GvG) => {
    const eqg = jData.proto.eventQuestGroup.find(eqg => eqg.questGroupId === GvG.eventQuestGroupId.toString());
    const banner = jData.proto.banner.find(b => b.bannerId === eqg.bannerId);
    const gvgName = `${jData.lsd.bannerText[banner.text1Id]} - ${jData.lsd.bannerText[banner.text2Id].replace("\n", " ")}`;

    let gvgList = document.getElementById("gvgList");
    let span = document.createElement("span");
    let a = document.createElement("a");
    a.innerText = gvgName;
    a.style.fontWeight = "bold";
    a.href = `#${GvG.gvgEventId}`;
    span.appendChild(a);
    span.innerHTML += `<br />`;
    gvgList.appendChild(span);


    let div = document.createElement("div");
    div.id = GvG.gvgEventId;
    div.style.width = "80%";
    div.style.margin = "0 auto";

    let h2 = document.createElement("h2");
    h2.innerText = `${gvgName} (${GvG.gvgEventId})`;
    h2.id = GvG.gvgEventId;
    div.appendChild(h2);

    let bossListDiv = document.createElement("div");
    bossListDiv.setAttribute("listSpan", "true");
    div.appendChild(bossListDiv);

    GvG.gvgBossIds.forEach(bossId => div.appendChild(printBoss(bossId, bossListDiv)));
    document.body.appendChild(div);
}

getData().then(() => {
    document.getElementById("pageTitle").innerText = "GVG Visualizer";

    let div = document.createElement("div");
    div.id = "gvgList";
    div.style.width = "80%";
    div.style.margin = "0 auto";
    div.setAttribute("listSpan", "true");
    document.body.appendChild(div);

    jData.proto.gvG.forEach(printGvG);
});
