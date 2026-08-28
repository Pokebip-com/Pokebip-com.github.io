
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
    jsonCache.preloadProto("MonsterBase");
    jsonCache.preloadProto("PassioTower");
    jsonCache.preloadProto("PassioTowerQuest");
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
    jsonCache.preloadLsd("passio_tower_name");
    jsonCache.preloadLsd("story_quest_name");

    // Other Preloads
    preloadUtils();
    preloadMovePassiveSkills();

    await jsonCache.runPreload();
}

function getTowerName(towerId) {
    const tower = jData.proto.passioTower.find(t => t.towerId === towerId);
    return tower ? tower.name : '';
}

const towerData = {
    currentTower: {},
    battle: {},
    floors: [],
    npc: {
        center: {},
        left: {},
        right: {}
    },
    weakTypes: [],
    name: function() { getTowerName(this.towerId) }
}

const state = {
    towerId: null,
    floorNum: 1,
    npc: "center",
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
    params.set('tower', state.towerId || '');
    state.floorNum = state.floorNum > getTowerFloors().length ? 1 : state.floorNum;
    params.set('floor', state.floorNum || '1');
    params.set('npc', state.npc || 'center');
    history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
}

function hydrateFromUrl() {
    const params = new URLSearchParams(location.search);
    state.towerId = params.get('tower') || state.towerId || jData.proto.passioTower[0].towerId;
    state.floorNum = parseInt(params.get('floor')) || state.floorNum;
    state.npc = params.get('npc') || state.npc;
}

function getTowerFloors(towerId = state.towerId) {
    return jData.proto.passioTowerQuest.filter(ptq => ptq.towerId.toString() === towerId.toString()).sort((a, b) => a.floor - b.floor) || [];
}

function fetchNPCs() {
    const storyQuestDetail = jData.proto.storyQuestDetail.find(sqd => sqd.storyQuestId.toString() === towerData.currentFloor.storyQuestId.toString());

    towerData.weakTypes = storyQuestDetail.weakTypes;

    const battle = jData.proto.battle.find(b => b.battleId === storyQuestDetail.battleIds[0]);

    const battleParams = jData.proto.battleParameter.find(bp => bp.battleParameterId === battle.battleParameterId);;

    towerData.npc.center = jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId1);
    towerData.npc.left = jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId2);
    towerData.npc.right = jData.proto.battleNpcUnit.find(npc => npc.npcUnitId === battleParams.npcUnitId3);

    towerData.npc.center.enemyOverwriteParams = jData.proto.enemyOverwriteParameter.find(eop => eop.enemyOverwriteParameterId.toString() === towerData.currentFloor.enemyOverwriteParameter[0].toString());
    towerData.npc.left.enemyOverwriteParams = towerData.npc.right.enemyOverwriteParams = jData.proto.enemyOverwriteParameter.find(eop => eop.enemyOverwriteParameterId.toString() === towerData.currentFloor.enemyOverwriteParameter[1].toString());

    let watchOut = []

    towerData.watchOut = [...new Set(watchOut)]
        .filter(as => as !== "-1")
        .map(as => jData.lsd.abnormalState[as]);
}

function fetchFloor(floor = state.floorNum) {
    towerData.currentFloor = towerData.floors.find(f => f.floor.toString() === floor.toString());

    fetchNPCs();
}

function fetchTowerData() {

    towerData.floors = jData.proto.passioTowerQuest.filter(ptq => ptq.towerId.toString() === state.towerId.toString()).sort((a, b) => a.floor - b.floor);

    state.floorNum = towerData.floors.findIndex(item => item.floor.toString() === state.floorNum.toString());
    state.floorNum = state.floorNum === -1 ? '1' : state.floorNum + 1;

    towerData.currentTower = jData.proto.passioTower.find(tower => tower.towerId.toString() === state.towerId.toString());
    state.towerId = towerData.currentTower.towerId.toString();

    fetchFloor();
}

function renderSelects() {
    $('#floorSelect').innerHTML = getTowerFloors().map((item, index) => `
        <option value="${escapeHtml(index + 1)}" ${(index + 1).toString() === state.floorNum.toString() || (index === 0 && getTowerFloors().length < state.floorNum) ? 'selected' : ''}>${index + 1}</option>
      `).join(``);
}

function renderTowersList() {
    let towers = jData.proto.passioTower;
    $('#towersList').innerHTML = towers.length ? towers.map(tower => `
        <button class="champion-card ${tower.towerId === state.towerId ? 'is-active' : ''}" type="button" data-champion-id="${escapeHtml(tower.towerId)}">
          <div class="brand-line">
            <span class="slot-icon" style="background-image: url('./data/icons/types/${tower.motifTypeNameId}.png'); background-size: contain;"></span>
            <strong>${escapeHtml(jData.lsd.passioTowerName[tower.passioTowerNameId])}</strong>
          </div>
        </button>
      `).join('') : '<div class="empty panel">Aucun résultat.</div>';

    $('#mobileStrip').innerHTML = towers.map(tower => `
        <button class="${tower.towerId === state.towerId ? 'is-active' : ''}" type="button" data-mobile-champion-id="${escapeHtml(tower.towerId)}" ><span class="slot-icon" style="background-image: url('./data/icons/types/${tower.motifTypeNameId}.png'); background-size: contain;"></span> ${escapeHtml(jData.lsd.passioTowerName[tower.passioTowerNameId])}</button>
      `).join('');

    document.querySelectorAll('[data-champion-id], [data-mobile-champion-id]').forEach(button => {
        button.addEventListener('click', () => {
            state.towerId = button.dataset.championId || button.dataset.mobileChampionId;
            towerData.currentTower = jData.proto.passioTower.find(tower => tower.towerId.toString() === state.towerId.toString());
            fetchFloor();
            syncUrl();
            render();
        });
    });
}

function renderSummary() {
    if (!towerData.currentFloor) {
        $('#summaryPanel').innerHTML = '<div class="empty">Sélectionne un étage.</div>';
        return;
    }
    const weak = jData.lsd.motifTypeName[towerData.weakTypes[0]];

    const storyQuest = jData.proto.storyQuest.find(sq => sq.storyQuestId.toString() === towerData.currentFloor.storyQuestId.toString());

    let theme = '0';
    if (towerData.currentFloor.battleChampionThemeId !== '0') {
        theme = jData.proto.battleChampionTheme.find(theme => theme.battleChampionThemeId.toString() === towerData.currentFloor.battleChampionThemeId.toString());
        theme.battleChampionRules = theme.battleChampionRuleIds.filter(rid => rid !== 0).map(rid => jData.proto.battleChampionRule.find(rule => rule.battleChampionRuleId.toString() === rid.toString()));
    }

    const name = jData.lsd.storyQuestName[storyQuest.questNameId].replace("[Digit:6digits ]", towerData.currentFloor.floor).replace("[Name:TowerName ]", jData.lsd.passioTowerName[towerData.currentTower.passioTowerNameId]);

    $('#summaryPanel').innerHTML = `
        <div class="summary-head">
          <div>
            <h2>${escapeHtml(name)}</h2>
          </div>
          </div>
          
          <div class="section-stack">
            <div class="section-title">Règle</div>
            <div class="passive-grid">
              <div class="passive-item">
                <div class="passive-item-head">
                  <div class="passive-inline">
                    ${ theme === '0' ? 'Aucune règle pour cet étage.' : tooltipButton(jData.lsd.championBattleTheme[theme.championBattleThemeName], theme.battleChampionRules.map(bcr => jData.lsd.championBattleRule[bcr.championBattleRuleName]).join("<br>"), jData.lsd.championBattleTheme[theme.championBattleThemeName]) }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
}

function renderPokemonTabs() {
    if (!towerData.currentFloor) {
        $('#pokemonTabs').innerHTML = '';
        return;
    }

    $('#pokemonTabs').innerHTML = ['left', 'center', 'right'].map(slot => {
        const npc = towerData.npc[slot];
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
    const npc = towerData.npc[state.npc];

    if (!npc) {
        $('#pokemonPanel').innerHTML = '<div class="empty">Aucun Pokémon.</div>';
        return;
    }

    const monster = jData.proto.monsterBase.find(mb => mb.actorId === npc.monsterActorId);
    const monsterName = jData.lsd.monsterName[monster.monsterNameId];

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
    renderTowersList();
    renderSummary();
    renderPokemonTabs();
    renderPokemonPanel();
}

function bindEvents() {
    $('#floorSelect').addEventListener('change', (event) => {
        state.floorNum = event.target.value;
        fetchFloor();
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
    fetchTowerData();
    bindEvents();
    render();
});
