
async function getData() {
    // PROTO
    jsonCache.preloadProto("Banner");
    jsonCache.preloadProto("Battle");
    jsonCache.preloadProto("BattleChampionRule");
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
    jsonCache.preloadLsd("champion_battle_rule");
    jsonCache.preloadLsd("champion_battle_theme");
    jsonCache.preloadLsd("monster_name");
    jsonCache.preloadLsd("motif_type_name");
    jsonCache.preloadLsd("story_quest_name");

    // Other Preloads
    preloadUtils();
    preloadMovePassiveSkills();

    await jsonCache.runPreload();
}

function getGvGName(gvg) {
    const eqg = jData.proto.eventQuestGroup.find(eqg => eqg.questGroupId === gvg.eventQuestGroupId.toString());
    const banner = jData.proto.banner.find(b => b.bannerId === eqg.bannerId);
    return `${gvg.gvgNum}. ${jData.lsd.bannerText[banner.text2Id].replace("\n", " ")}`;
}

const gvgData = {
    gvg: {},
    battle: {},
    boss: [],
    bossRound: {},
    npc: {
        center: {},
        left: {},
        right: {}
    },
    weakTypes: [],
    name: function() { getGvGName(this.gvg) }
}

const state = {
    gvgId: null,
    bossId: "",
    bossNum: 0,
    roundNum: 1,
    bossRoundId: "",
    npc: "center",
    cycleId: 'cycle-1',
    theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function slotLabel(slot) {
    return ({ left: 'Left', center: 'Center', right: 'Right' }[slot]) || slot;
}

function syncUrl() {
    const params = new URLSearchParams();
    params.set('gvg', state.gvgId);
    params.set('boss', state.bossId);
    params.set('round', state.bossRoundId || '');
    state.roundNum = state.roundNum > getBossRoundIds().length ? 1 : state.roundNum;
    params.set('circuit', state.roundNum || 1);
    params.set('npc', state.npc || 'center');
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
}

function hydrateFromUrl() {
    const params = new URLSearchParams(location.search);
    state.gvgId = params.get('gvg') || state.gvgId || jData.proto.gvG[jData.proto.gvG.length - 1].gvgId;
    state.bossId = params.get('boss') || state.bossId;
    state.bossRoundId = params.get('round') || state.bossRoundId;
    state.roundNum = params.get('circuit') || state.roundNum;
    state.npc = params.get('npc') || state.npc;
}

function getBossRoundIds(bossNum = state.bossNum) {
    return gvgData.boss[bossNum]?.gvgBossRoundIds.concat(gvgData.boss[bossNum]?.gvgBossRoundRepeatedId) || [];
}

function fetchNPCs() {
    const storyQuestDetail = jData.proto.storyQuestDetail.find(sqd => sqd.storyQuestId.toString() === gvgData.bossRound.storyQuestId.toString());

    gvgData.weakTypes = storyQuestDetail.weakTypes;

    const battle = jData.proto.battle.find(b => b.battleId === storyQuestDetail.battleIds[0]);

    const battleParams = jData.proto.battleParameter.find(bp => bp.battleParameterId === battle.battleParameterId);;

    gvgData.npc.center = jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId1);
    gvgData.npc.left = jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId2);
    gvgData.npc.right = jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId3);

    gvgData.npc.center.enemyOverwrite = jData.proto.gvGEnemyOverwrite.find(eo => eo.gvgEnemyOverwriteId.toString() === gvgData.bossRound.gvgEnemyOverwriteIds[0].toString());
    gvgData.npc.center.enemyOverwriteParams = jData.proto.enemyOverwriteParameter.find(eop => eop.enemyOverwriteParameterId.toString() === gvgData.npc.center.enemyOverwrite.enemyOverwriteParameterId.toString());

    gvgData.npc.left.enemyOverwrite = gvgData.npc.right.enemyOverwrite = jData.proto.gvGEnemyOverwrite.find(eo => eo.gvgEnemyOverwriteId.toString() === gvgData.bossRound.gvgEnemyOverwriteIds[1].toString());
    gvgData.npc.left.enemyOverwriteParams = gvgData.npc.right.enemyOverwriteParams = jData.proto.enemyOverwriteParameter.find(eop => eop.enemyOverwriteParameterId.toString() === gvgData.npc.left.enemyOverwrite.enemyOverwriteParameterId.toString());

    let watchOut = []

    for(let i = 1; i <= 3; i++) {
        watchOut.push(gvgData.npc.center.enemyOverwrite[`abnormalStateWatchOut${i}`]);
        watchOut.push(gvgData.npc.left.enemyOverwrite[`abnormalStateWatchOut${i}`]);
    }

    gvgData.watchOut = [...new Set(watchOut)]
        .filter(as => as !== "-1")
        .map(as => jData.lsd.abnormalState[as]);
}

function fetchBossRound(round = state.roundNum) {
    const boss = gvgData.boss.find(b => b.gvgBossId.toString() === state.bossId);
    const roundId = (round <= boss.gvgBossRoundIds.length ? boss.gvgBossRoundIds[round - 1] : boss.gvgBossRoundRepeatedId);

    state.cycleId = roundId;
    state.roundNum = round;

    gvgData.bossRound = jData.proto.gvGBossRound.find(bossRound => bossRound.gvgBossRoundId === roundId);

    state.bossRoundId = gvgData.bossRound.gvgBossRoundId;

    fetchNPCs();
}

function fetchGvGData() {
    gvgData.gvg = jData.proto.gvG.find(gvg => gvg.gvgId.toString() === state.gvgId.toString());
    gvgData.boss = jData.proto.gvGBoss.filter(boss => gvgData.gvg.gvgBossIds.includes(boss.gvgBossId.toString()));

    gvgData.boss.forEach(boss => {
        boss.weakType = jData.proto.storyQuestDetail.find(sqd => sqd.storyQuestId === jData.proto.gvGBossRound.find(br => br.gvgBossRoundId === boss.gvgBossRoundIds[0]).storyQuestId).weakTypes[0];
    })

    state.bossNum = gvgData.boss.findIndex(item => item.gvgBossId.toString() === state.bossId.toString());
    state.bossNum = state.bossNum === -1 ? 0 : state.bossNum;
    state.bossId = gvgData.boss[state.bossNum].gvgBossId.toString();
    fetchBossRound();
    console.log(gvgData);
}

function renderSelects() {

    $('#editionSelect').innerHTML = jData.proto.gvG.map(item => `
        <option value="${escapeHtml(item.gvgId)}" ${item.gvgId.toString() === state.gvgId.toString() ? 'selected' : ''}>${escapeHtml(getGvGName(item))}</option>
      `).join('');

    $('#cycleSelect').innerHTML = getBossRoundIds().map((item, index) => `
        <option value="${escapeHtml(index + 1)}" ${(index + 1).toString() === state.roundNum.toString() || (index === 0 && getBossRoundIds().length < state.roundNum) ? 'selected' : ''}>${index + 1}</option>
      `).join(``);
}

function renderChampionList() {
    let champions = gvgData.boss;
    $('#championList').innerHTML = champions.length ? champions.map(champion => `
        <button class="champion-card ${champion.gvgBossId === state.bossId ? 'is-active' : ''}" type="button" data-champion-id="${escapeHtml(champion.gvgBossId)}">
          <div class="brand-line">
            <span class="slot-icon" style="background-image: url('./data/icons/types/${champion.weakType}.png'); background-size: contain;"></span>
            <strong>${escapeHtml(getTrainerNameByActorId(champion.actorId))}</strong>
          </div>
        </button>
      `).join('') : '<div class="empty panel">Aucun résultat.</div>';

    $('#mobileStrip').innerHTML = champions.map(champion => `
        <button class="${champion.gvgBossId === state.bossId ? 'is-active' : ''}" type="button" data-mobile-champion-id="${escapeHtml(champion.gvgBossId)}" ><span class="slot-icon" style="background-image: url('./data/icons/types/${champion.weakType}.png'); background-size: contain;"></span> ${escapeHtml(getTrainerNameByActorId(champion.actorId))}</button>
      `).join('');

    document.querySelectorAll('[data-champion-id], [data-mobile-champion-id]').forEach(button => {
        button.addEventListener('click', () => {
            state.bossId = button.dataset.championId || button.dataset.mobileChampionId;
            state.bossNum = gvgData.boss.findIndex(item => item.gvgBossId.toString() === state.bossId.toString());
            fetchBossRound();
            syncUrl();
            render();
        });
    });
}

function renderSummary() {
    if (!gvgData.boss) {
        $('#summaryPanel').innerHTML = '<div class="empty">Sélectionne un combat.</div>';
        return;
    }
    const weak = jData.lsd.motifTypeName[gvgData.weakTypes[0]];

    let themes = (state.roundNum > gvgData.boss[state.bossNum].roundsBattleChampionThemeIds.length ? gvgData.boss[state.bossNum].repeatedRoundBattleChampionThemeIds : [gvgData.boss[state.bossNum].roundsBattleChampionThemeIds[state.roundNum - 1]])
        .map(id => {
            if (id === '0') return '0';
            let theme = jData.proto.battleChampionTheme.find(theme => theme.battleChampionThemeId.toString() === id.toString());
            theme.battleChampionRules = theme.battleChampionRuleIds.filter(rid => rid !== 0).map(rid => jData.proto.battleChampionRule.find(rule => rule.battleChampionRuleId.toString() === rid.toString()));
            return theme;
        });

    $('#summaryPanel').innerHTML = `
        <div class="summary-head">
          <div>
            <h2><span class="slot-icon" style="background-image: url('./data/icons/types/${gvgData.boss[state.bossNum].type}.png'); background-size: contain;"></span> ${escapeHtml(getTrainerNameByActorId(gvgData.boss[state.bossNum].actorId))}</h2>
          </div>
          <div class="chip-row">
            <strong>Faiblesse :</strong> <span class="summary-pill primary"><span class="slot-icon" style="margin-right: 5px; background-image: url('./data/icons/types/${gvgData.weakTypes[0]}.png'); background-size: contain;"></span> <strong>${escapeHtml(weak)}</strong></span>
          </div>
          
          <div class="section-stack">
            <div class="section-title">Règles</div>
            ${themes.length > 1 ? '<div class="muted">La règle change à chaque cycle. L\'ordre affiché est celui qui est utilisé en jeu.</div>' : ''}
            <div class="passive-grid">
              ${themes.map((theme, index) => `<div class="passive-item">
                <div class="passive-item-head">
                  ${ theme === '0' ? '' : `<span class="num-badge">${index + 1}</span>` }
                  <div class="passive-inline">
                    ${ theme === '0' ? 'Aucune règle pour ce cycle.' : tooltipButton(jData.lsd.championBattleTheme[theme.championBattleThemeName], theme.battleChampionRules.map(bcr => jData.lsd.championBattleRule[bcr.championBattleRuleName]).join("<br>"), jData.lsd.championBattleTheme[theme.championBattleThemeName]) }
                  </div>
                </div>
              </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
}

function renderPokemonTabs() {
    if (!gvgData.boss) {
        $('#pokemonTabs').innerHTML = '';
        return;
    }

    $('#pokemonTabs').innerHTML = ['left', 'center', 'right'].map(slot => {
        const npc = gvgData.npc[slot];
        const monster = jData.proto.monsterBase.find(mb => mb.actorId === npc.monsterActorId);
        const monsterName = jData.lsd.monsterName[monster.monsterNameId];
        return `
            <button class="pokemon-tab ${slot === state.npc ? 'is-active' : ''} ${slot === 'left' ? 'slot-left' : slot === 'center' ? 'slot-center' : 'slot-right'}" type="button" data-slot="${slot}">
              <strong>${escapeHtml(monsterName)}</strong>
              <span class="tiny muted">${escapeHtml(slotLabel(slot))}</span>
            </button>
          `;
    }).join('');

    document.querySelectorAll('[data-slot]').forEach(button => {
        button.addEventListener('click', () => {
            state.npc = button.dataset.slot;
            syncUrl();
            renderPokemonPanel();
            renderPokemonTabs();
        });
    });
}

function tooltipButton(label, description, title = '') {
    const safeLabel = escapeHtml(label || '-');
    const safeDesc = escapeHtml(description || '-');
    const safeTitle = escapeHtml(title || label || 'Détail');
    return `
        <span class="tooltip-trigger" role="button" tabindex="0" data-tooltip-title="${safeTitle}" data-tooltip-body="${safeDesc}">
          <span class="tooltip-content">
            <strong>${safeLabel}</strong>
            <span class="info-mark" aria-hidden="true">i</span>
          </span>
        </button>
      `;
}

function moveUsesLabel(value) {
    return value === 0 || value === '-' || value === null || value === undefined ? '0' : value;
}

function renderPokemonPanel() {
    const npc = gvgData.npc[state.npc];

    if (!npc) {
        $('#pokemonPanel').innerHTML = '<div class="empty">Aucun Pokémon.</div>';
        return;
    }

    const monster = jData.proto.monsterBase.find(mb => mb.actorId === npc.monsterActorId);
    const monsterName = jData.lsd.monsterName[monster.monsterNameId];

    const primaryPassiveIds = ["1", "2", "3"].map(i => npc.enemyOverwrite[`passive${i}Id`]).filter(p => p !== "0");
    const moves = [];

    for(let i = 1; i <= 6; i++) {
        if(npc[`move${i}Id`] !== -1) {
            moves.push({ id: npc[`move${i}Id`], uses: npc[`move${i}Uses`] });
        }
    }

    const passives = [];
    for(let i = 1; i <= 20; i++) {
        if(npc[`passive${i}Id`] !== 0) {
            passives.push(npc[`passive${i}Id`]);
        }
    }

    let moveNum = 1;

    $('#pokemonPanel').innerHTML = `
        <div class="pokemon-head">
          <div class="pokemon-head">
              <div>
                <h3><span class="slot-badge">${escapeHtml(slotLabel(state.npc))}</span> ${escapeHtml(monsterName)}</h3>
    
                <div class="section-stack left-stack">
                  <div class="section-title">Statistiques</div>
                  <div class="passive-grid primary-passives">
                    <div class="stat-row"><span>HP</span><strong>${escapeHtml(npc.enemyOverwriteParams?.hp ?? '-')}</strong></div>
                    <div class="stat-row"><span>ATK</span><strong>${escapeHtml(npc.enemyOverwriteParams?.atk ?? '-')}</strong></div>
                    <div class="stat-row"><span>DEF</span><strong>${escapeHtml(npc.enemyOverwriteParams?.def ?? '-')}</strong></div>
                    <div class="stat-row"><span>SPA</span><strong>${escapeHtml(npc.enemyOverwriteParams?.spa ?? '-')}</strong></div>
                    <div class="stat-row"><span>SPD</span><strong>${escapeHtml(npc.enemyOverwriteParams?.spd ?? '-')}</strong></div>
                    <div class="stat-row"><span>SPE</span><strong>${escapeHtml(npc.enemyOverwriteParams?.spe ?? '-')}</strong></div>
                  </div>
                </div>
              </div>
    
            <div class="pokemon-meta">
              <div class="meta-row">
                <span class="meta-label">Faiblesse :</span>
                <span class="tag watch"><span class="slot-icon" style="margin-right: 5px; background-image: url('./data/icons/types/${npc.weakType}.png'); background-size: contain;"></span> <strong>${escapeHtml(jData.lsd.motifTypeName[npc.weakType] || '-')}</strong></span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Attention :</span>
                <div class="tag-row">
                  ${["1", "2", "3"].map(i => npc.enemyOverwrite[`abnormalStateWatchOut${i}`]).filter(as => as !== "-1").length ? ["1", "2", "3"].map(i => npc.enemyOverwrite[`abnormalStateWatchOut${i}`]).filter(as => as !== "-1").map(item => `<span class="tag watch"><strong>${escapeHtml(jData.lsd.abnormalState[item])}</strong></span>`).join('') : '<span class="faint">-</span>'}
                </div>
              </div>
              <div class="meta-row">
                <span class="meta-label">Recommandé :</span>
                <div class="tag-row">
                  ${["1", "2"].map(i => npc.enemyOverwrite[`abnormalStateFocus${i}`]).filter(as => as !== "-1").length ? ["1", "2"].map(i => npc.enemyOverwrite[`abnormalStateFocus${i}`]).filter(as => as !== "-1").map(item => `<span class="tag focus"><strong>${escapeHtml(jData.lsd.abnormalState[item])}</strong></span>`).join('') : '<span class="faint">-</span>'}
                </div>
              </div>
            </div>
        </div>

        <div class="section-stack">
          <div class="section-title">Capacités</div>
          <div class="passive-grid primary-passives">
            ${moves.length ? moves.map(move => {
        const uses = moveUsesLabel(move.uses);
        const infinite = uses === '0';
        return `
                <article class="passive-item ${infinite ? 'primary-passive' : ''}">
                  <div class="passive-item-head">
                    <span class="num-badge">${escapeHtml(moveNum++)}</span>
                    <div>
                      ${tooltipButton(jData.lsd.moveName[move.id], getMoveDescr(move.id), jData.lsd.moveName[move.id])}
                      ${uses === '0' ? '' : `<p><span class="limit-badge">×${escapeHtml(uses)}</span></p>`}
                    </div>
                  </div>
                </article>
              `;
    }).join('') : '<p class="muted">Aucune attaque renseignée.</p>'}
          </div>
        </div>

        <div class="section-stack">
          <div class="section-title">Talents passifs</div>
          ${(primaryPassiveIds.length || passives.length) ? `
            ${primaryPassiveIds.length ? `
              <div class="passive-grid primary-passives">
                ${primaryPassiveIds.map((item, index) => `
                  <article class="passive-item primary-passive">
                    <div class="passive-item-head">
                      <span class="num-badge">P${index + 1}</span>
                      <div class="passive-inline">
                        ${tooltipButton(getPassiveSkillName(item), getPassiveSkillDescr(item), getPassiveSkillName(item))}
                      </div>
                    </div>
                  </article>
                `).join('')}
              </div>
              <hr class="passive-separator">
            ` : ''}
            <div class="passive-grid">
              ${passives.map((passive, index) => `
                <article class="passive-item">
                  <div class="passive-item-head">
                    <span class="num-badge">${index + 1}</span>
                    <div class="passive-inline">
                      ${tooltipButton(getPassiveSkillName(passive), getPassiveSkillDescr(passive), getPassiveSkillName(passive))}
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>
          ` : '<p class="muted">Aucun passif renseigné.</p>'}
        </div>
      `;

    bindTooltipTriggers();
}
function positionTooltip(trigger, panel) {
    const rect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 12;
    let left = rect.left;
    let top = rect.bottom + 10;

    if (left + panelRect.width > window.innerWidth - margin) {
        left = window.innerWidth - panelRect.width - margin;
    }
    if (left < margin) left = margin;
    if (top + panelRect.height > window.innerHeight - margin) {
        top = rect.top - panelRect.height - 10;
    }
    if (top < margin) top = margin;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}

function hideTooltip() {
    const panel = $('#tooltip');
    panel.classList.remove('is-visible');
    panel.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.tooltip-trigger[data-open="true"]').forEach(node => node.setAttribute('data-open', 'false'));
}

function showTooltip(trigger) {
    const panel = $('#tooltip');
    const title = trigger.dataset.tooltipTitle || 'Détail';
    const body = trigger.dataset.tooltipBody || '-';
    panel.innerHTML = `<div class="tooltip-title">${title}</div><div class="tooltip-body">${body}</div>`;
    panel.classList.add('is-visible');
    panel.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('.tooltip-trigger[data-open="true"]').forEach(node => node.setAttribute('data-open', 'false'));
    trigger.setAttribute('data-open', 'true');
    positionTooltip(trigger, panel);
}

function bindTooltipTriggers() {
    document.querySelectorAll('.tooltip-trigger, .tooltip-card').forEach(trigger => {
        trigger.addEventListener('mouseenter', () => showTooltip(trigger));
        trigger.addEventListener('focus', () => showTooltip(trigger));
        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = trigger.getAttribute('data-open') === 'true';
            if (isOpen) hideTooltip(); else showTooltip(trigger);
        });
    });
}

function render() {
    //normalizeState();
    renderSelects();
    renderChampionList();
    renderSummary();
    renderPokemonTabs();
    renderPokemonPanel();
}

function bindEvents() {
    $('#editionSelect').addEventListener('change', (event) => {
        state.gvgId = event.target.value;
        fetchGvGData();
        syncUrl();
        render();
    });

    $('#cycleSelect').addEventListener('change', (event) => {
        fetchBossRound(event.target.value);
        syncUrl();
        render();
    });

    const root = document.documentElement;
    root.setAttribute('data-theme', state.theme);
    $('[data-theme-toggle]').addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', state.theme);
    });

    window.addEventListener('resize', hideTooltip);
    window.addEventListener('scroll', hideTooltip, true);
    document.addEventListener('click', hideTooltip);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') hideTooltip();
    });
}

getData().then(() => {
    hydrateFromUrl();
    fetchGvGData();
    bindEvents();
    render();
});
