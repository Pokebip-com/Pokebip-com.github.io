async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("BattleChampionTheme");
    jsonCache.preloadProto("EnemyOverwriteParameter");
    jsonCache.preloadProto("EventQuestGroup");
    jsonCache.preloadProto("GvG");
    jsonCache.preloadProto("GvGBoss");
    jsonCache.preloadProto("GvGBossRound");
    jsonCache.preloadProto("GvGEnemyOverwrite");
    jsonCache.preloadProto("GvGRound");
    jsonCache.preloadProto("StoryQuest");
    jsonCache.preloadProto("StoryQuestDetail");
    jsonCache.preloadProto("TrainerBase");

    // LSD
    jsonCache.preloadLsd("banner_text");
    jsonCache.preloadLsd("champion_battle_theme");
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

printEnemies = (enemyIds) => {
    let div = document.createElement("div");

    enemyIds.forEach(enemyId => {
        let enemy = jData.proto.gvGEnemyOverwrite.find(e => e.gvgEnemyOverwriteId.toString() === enemyId.toString());

        const enemyType = enemyId.endsWith("1") ? "Center" : "Sides";

        let table = document.createElement("table");
        table.classList.add("bipcode");
        table.style.textAlign = "center";

        let thead = document.createElement("thead");
        let tr = document.createElement("tr");

        let enemyTypeTh = document.createElement("th");
        enemyTypeTh.innerText = enemyType;
        enemyTypeTh.colSpan = 24;
        tr.appendChild(enemyTypeTh);
        thead.appendChild(tr);

        tr = document.createElement("tr");

        let idTh = document.createElement("th");
        idTh.innerText = "Id";
        idTh.rowSpan = 2;
        tr.appendChild(idTh);

        let u3Th = document.createElement("th");
        u3Th.innerText = "u3";
        u3Th.rowSpan = 2;
        tr.appendChild(u3Th);

        let u7Th = document.createElement("th");
        u7Th.innerText = "u7";
        u7Th.rowSpan = 2;
        tr.appendChild(u7Th);

        let u12Th = document.createElement("th");
        u12Th.innerText = "u12";
        u12Th.rowSpan = 2;
        tr.appendChild(u12Th);

        let u17Th = document.createElement("th");
        u17Th.innerText = "u17";
        u17Th.rowSpan = 2;
        tr.appendChild(u17Th);

        let u22Th = document.createElement("th");
        u22Th.innerText = "u22";
        u22Th.rowSpan = 2;
        tr.appendChild(u22Th);

        let u23Th = document.createElement("th");
        u23Th.innerText = "u23";
        u23Th.rowSpan = 2;
        tr.appendChild(u23Th);

        let u27Th = document.createElement("th");
        u27Th.innerText = "u27";
        u27Th.rowSpan = 2;
        tr.appendChild(u27Th);

        let u32Th = document.createElement("th");
        u32Th.innerText = "u32";
        u32Th.rowSpan = 2;
        tr.appendChild(u32Th);

        let u37Th = document.createElement("th");
        u37Th.innerText = "u37";
        u37Th.rowSpan = 2;
        tr.appendChild(u37Th);

        let passive1IdTh = document.createElement("th");
        passive1IdTh.innerText = "passive1";
        passive1IdTh.rowSpan = 2;
        tr.appendChild(passive1IdTh);

        let passive2IdTh = document.createElement("th");
        passive2IdTh.innerText = "passive2";
        passive2IdTh.rowSpan = 2;
        tr.appendChild(passive2IdTh);

        let passive3IdTh = document.createElement("th");
        passive3IdTh.innerText = "passive3";
        passive3IdTh.rowSpan = 2;
        tr.appendChild(passive3IdTh);

        let enemyOverwriteParameterIdTh = document.createElement("th");
        enemyOverwriteParameterIdTh.innerText = "enemyOverwriteParameterId";
        enemyOverwriteParameterIdTh.colSpan = 6;
        tr.appendChild(enemyOverwriteParameterIdTh);

        let u46Th = document.createElement("th");
        u46Th.innerText = "u46";
        u46Th.rowSpan = 2;
        tr.appendChild(u46Th);

        let u47Th = document.createElement("th");
        u47Th.innerText = "u47";
        u47Th.rowSpan = 2;
        tr.appendChild(u47Th);

        let u48Th = document.createElement("th");
        u48Th.innerText = "u48";
        u48Th.rowSpan = 2;
        tr.appendChild(u48Th);

        let u49Th = document.createElement("th");
        u49Th.innerText = "u49";
        u49Th.rowSpan = 2;
        tr.appendChild(u49Th);

        let u50Th = document.createElement("th");
        u50Th.innerText = "u50";
        u50Th.rowSpan = 2;
        tr.appendChild(u50Th);
        thead.appendChild(tr);

        tr = document.createElement("tr");

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

        thead.appendChild(tr);

        let tbody = document.createElement("tbody");

        tr = document.createElement("tr");

        let idTd = document.createElement("td");
        idTd.innerText = enemy.gvgEnemyOverwriteId;
        tr.appendChild(idTd);

        let u3Td = document.createElement("td");
        u3Td.innerText = enemy.u3;
        tr.appendChild(u3Td);

        let u7Td = document.createElement("td");
        u7Td.innerText = enemy.u7;
        tr.appendChild(u7Td);

        let u12Td = document.createElement("td");
        u12Td.innerText = enemy.u12;
        tr.appendChild(u12Td);

        let u17Td = document.createElement("td");
        u17Td.innerText = enemy.u17;
        tr.appendChild(u17Td);

        let u22Td = document.createElement("td");
        u22Td.innerText = enemy.u22;
        tr.appendChild(u22Td);

        let u23Td = document.createElement("td");
        u23Td.innerText = enemy.u23;
        tr.appendChild(u23Td);

        let u27Td = document.createElement("td");
        u27Td.innerText = enemy.u27;
        tr.appendChild(u27Td);

        let u32Td = document.createElement("td");
        u32Td.innerText = enemy.u32;
        tr.appendChild(u32Td);

        let u37Td = document.createElement("td");
        u37Td.innerText = enemy.u37;
        tr.appendChild(u37Td);

        let passive1IdTd = document.createElement("td");
        passive1IdTd.innerText = getPassiveSkillName(enemy.passive1Id) ?? "-";
        tr.appendChild(passive1IdTd);

        let passive2IdTd = document.createElement("td");
        passive2IdTd.innerText = getPassiveSkillName(enemy.passive2Id) ?? "-";
        tr.appendChild(passive2IdTd);

        let passive3IdTd = document.createElement("td");
        passive3IdTd.innerText = getPassiveSkillName(enemy.passive3Id) ?? "-";
        tr.appendChild(passive3IdTd);

        tr = printEnemyOverwriteParameters(enemy.enemyOverwriteParameterId, tr);

        let u46Td = document.createElement("td");
        u46Td.innerText = enemy.u46;
        tr.appendChild(u46Td);

        let u47Td = document.createElement("td");
        u47Td.innerText = enemy.u47;
        tr.appendChild(u47Td);

        let u48Td = document.createElement("td");
        u48Td.innerText = enemy.u48;
        tr.appendChild(u48Td);

        let u49Td = document.createElement("td");
        u49Td.innerText = enemy.u49;
        tr.appendChild(u49Td);

        let u50Td = document.createElement("td");
        u50Td.innerText = enemy.u50;
        tr.appendChild(u50Td);

        tbody.appendChild(tr);

        table.appendChild(thead);
        table.appendChild(tbody);

        table.style.width = "100%";
        table.style.maxWidth = "100%";
        table.style.tableLayout = "fixed";

        div.appendChild(table);
        div.appendChild(document.createElement("br"));
    });

    return div;
}

printRound = (roundId, themeId, roundNum) => {
    let div = document.createElement("div");
    div.id = roundId;

    const bossRound = jData.proto.gvGBossRound.find(br => br.gvgBossRoundId.toString() === roundId.toString());
    const storyQuest = jData.proto.storyQuest.find(sq => sq.storyQuestId.toString() === bossRound.storyQuestId.toString());
    const storyQuestDetail = jData.proto.storyQuestDetail.find(sqd => sqd.storyQuestId.toString() === storyQuest.storyQuestId.toString());
    const questName = jData.lsd.storyQuestName[storyQuest.questNameId];

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


    div.appendChild(printEnemies(bossRound.gvgEnemyOverwriteIds));

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
