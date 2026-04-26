var modalScrollTop = 0;

function setModalScrollLock(locked) {
  var $body = $('body');
  if (locked) {
    modalScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    $body.addClass('modal-open');
    $body.css({ top: -modalScrollTop + 'px' });
  } else {
    $body.removeClass('modal-open');
    $body.css({ top: '' });
    window.scrollTo(0, modalScrollTop);
  }
}

function closeModalAndUnlock(selector) {
  var $modal = $(selector);
  if ($modal.length) {
    if (typeof $modal.closeModal === 'function') {
      $modal.closeModal();
    } else {
      $modal.hide();
    }
  }
  window.setTimeout(function () {
    setModalScrollLock(false);
  }, 350);
}

$(document).ready(function () {
  $('#gameDiv').hide();
  $('.modal-trigger').leanModal({
    ready: function () {
      setModalScrollLock(true);
    },
    complete: function () {
      setModalScrollLock(false);
    }
  });
  $('.tooltipped').tooltip({ delay: 50 });
});

var socket = io();
var gameInfo = null;
var roomSettings = {
  blinds: { small: 1, big: 2 },
  buyIn: { startingStack: 100, autoRebuy: true, autoRebuyStack: 100 },
};
var lastCommunityMarkup = '';
var lastOpponentMarkup = '';
var lastSelfTurnState = null;
var lastSelfTurnRound = null;
var lastPossibleMoves = null;
var lastLobbyPlayers = null;
var lastLobbyRoomState = null;
var currentHostRoomCode = null;
var hostRoomSettingsEditorOpen = false;
var hostRoomSettingsSyncState = 'idle';
var hostRoomSettingsSyncTimer = null;
var hostRoomSettingsSyncFailTimer = null;
var lastHostRoomData = null;
var amountControls =
  typeof AmountControls !== 'undefined'
    ? AmountControls
    : {
        normalizeActionAmount: function (rawValue, min, max) {
          var parsed = Math.floor(Number(rawValue));
          var minValue = Number.isFinite(Number(min)) ? Number(min) : 0;
          var maxValue = Number.isFinite(Number(max)) ? Number(max) : minValue;
          if (maxValue < minValue) maxValue = minValue;
          if (!Number.isFinite(parsed)) return minValue;
          if (parsed < minValue) return minValue;
          if (parsed > maxValue) return maxValue;
          return parsed;
        },
        formatActionAmountLabel: function (amount, max) {
          var parsedAmount = Math.max(0, Math.floor(Number(amount) || 0));
          var parsedMax = Math.max(0, Math.floor(Number(max) || 0));
          return parsedMax > 0 && parsedAmount === parsedMax ? '全下 $' + parsedAmount : '$' + parsedAmount;
        },
      };

function getHostSettingsFormValues() {
  return {
    smallBlind: parseInt($('#smallBlind-field').val(), 10) || 1,
    bigBlind: parseInt($('#bigBlind-field').val(), 10) || 2,
    startingStack: parseInt($('#startingStack-field').val(), 10) || 100,
    autoRebuy: $('#autoRebuy-field').is(':checked'),
    autoRebuyStack: parseInt($('#autoRebuyStack-field').val(), 10) || 100,
  };
}

function resetRoomSettingsForm() {
  $('#smallBlind-field').val(1);
  $('#bigBlind-field').val(2);
  $('#startingStack-field').val(100);
  $('#autoRebuyStack-field').val(100);
  $('#autoRebuy-field').prop('checked', true);
}

function refreshHostRoomModalContent() {
  if (!lastHostRoomData) return;
  $('#hostModalContent').html(renderHostRoomModalContent(lastHostRoomData));
}

function openHostRoomSettingsEditor() {
  hostRoomSettingsEditorOpen = true;
  refreshHostRoomModalContent();
}

function closeHostRoomSettingsEditor() {
  hostRoomSettingsEditorOpen = false;
  refreshHostRoomModalContent();
}

function setHostRoomSettingsSyncState(nextState) {
  hostRoomSettingsSyncState = nextState;
  if (hostRoomSettingsSyncTimer) {
    clearTimeout(hostRoomSettingsSyncTimer);
    hostRoomSettingsSyncTimer = null;
  }
  if (hostRoomSettingsSyncFailTimer) {
    clearTimeout(hostRoomSettingsSyncFailTimer);
    hostRoomSettingsSyncFailTimer = null;
  }
  if (nextState === 'synced') {
    hostRoomSettingsSyncTimer = setTimeout(function () {
      hostRoomSettingsSyncState = 'idle';
      hostRoomSettingsSyncTimer = null;
      refreshHostRoomModalContent();
    }, 2200);
  } else if (nextState === 'syncing') {
    hostRoomSettingsSyncFailTimer = setTimeout(function () {
      if (hostRoomSettingsSyncState === 'syncing') {
        hostRoomSettingsSyncState = 'error';
        hostRoomSettingsSyncFailTimer = null;
        refreshHostRoomModalContent();
        Materialize.toast('同步超时，房间可能还没收到新配置。', 3000);
      }
    }, 5000);
  }
}

function renderHostRoomModalContent(data) {
  if (!data) return '';
  var players = Array.isArray(data.players) ? data.players : [];
  var intro =
    players.length > 1
      ? '人到齐了，先检查一下配置，准备好就可以开始牌局。'
      : '把房码发给朋友，等人进来后再开局。';
  var settingsEntryLabel = hostRoomSettingsEditorOpen ? '收起修改' : '修改配置';
  var settingsEntryState = hostRoomSettingsEditorOpen
    ? '编辑中'
    : hostRoomSettingsSyncState === 'synced'
      ? '已同步'
      : hostRoomSettingsSyncState === 'syncing'
        ? '同步中'
        : hostRoomSettingsSyncState === 'error'
          ? '同步失败'
          : '已保存';
  var settingsEntryHint = hostRoomSettingsEditorOpen
    ? '修改后点保存就会同步到房间。'
    : hostRoomSettingsSyncState === 'syncing'
      ? '正在把新配置写入房间，请稍等一下。'
      : hostRoomSettingsSyncState === 'synced'
        ? '新配置已同步到房间。'
        : hostRoomSettingsSyncState === 'error'
          ? '房间可能还没收到新配置，稍后可重试。'
          : '盲注、起始筹码和补码都在这里改。';
  var settingsEntryClass = 'room-settings-entry';
  if (hostRoomSettingsEditorOpen) {
    settingsEntryClass += ' is-editing';
  } else if (hostRoomSettingsSyncState === 'syncing') {
    settingsEntryClass += ' is-syncing';
  } else if (hostRoomSettingsSyncState === 'synced') {
    settingsEntryClass += ' is-synced';
  } else if (hostRoomSettingsSyncState === 'error') {
    settingsEntryClass += ' is-error';
  }
  var settingsSummaryState = hostRoomSettingsEditorOpen
    ? '正在编辑'
    : hostRoomSettingsSyncState === 'synced'
      ? '已同步'
      : hostRoomSettingsSyncState === 'syncing'
        ? '同步中'
        : hostRoomSettingsSyncState === 'error'
          ? '同步失败'
          : '已保存';
  var settingsSummaryHint = hostRoomSettingsEditorOpen
    ? '点保存后，摘要会立刻换成新配置。'
    : hostRoomSettingsSyncState === 'synced'
      ? '摘要已刷新，房间也已同步。'
      : hostRoomSettingsSyncState === 'syncing'
        ? '正在同步最新配置到房间。'
        : hostRoomSettingsSyncState === 'error'
          ? '摘要已改，但同步可能有延迟。'
          : '改完后这里会直接反映最新配置。';
  return (
    '<div class="room-host-hero">' +
    '<span class="table-badge subtle">房码</span>' +
    '<code class="room-code">' + escapeHtml(data.code) + '</code>' +
    '<p class="room-host-note">' + intro + '</p>' +
    '</div>' +
    '<div class="room-host-summary">' +
    '<div class="room-host-summary-head">' +
    '<strong>当前配置</strong>' +
    '<span class="room-host-summary-state">' + settingsSummaryState + '</span>' +
    '</div>' +
    '<p class="room-host-summary-hint">' + settingsSummaryHint + '</p>' +
    renderRoomSettings(data.settings) +
    '</div>' +
    '<div class="' + settingsEntryClass + '">' +
    '<div class="room-settings-entry-copy">' +
    '<strong>房主配置</strong>' +
    '<span class="room-settings-entry-state">' + settingsEntryState + '</span>' +
    '<span>' + settingsEntryHint + '</span>' +
    '</div>' +
    '<button type="button" class="waves-effect waves-light btn-flat modal-action-btn room-settings-edit-btn" onclick="' +
    (hostRoomSettingsEditorOpen ? 'closeHostRoomSettingsEditor()' : 'openHostRoomSettingsEditor()') +
    '">' + settingsEntryLabel + '</button>' +
    '</div>' +
    (hostRoomSettingsEditorOpen ? renderRoomSettingsEditor(data.settings) : '')
  );
}

function mergeHostRoomState(previous, next) {
  if (!next) return previous || null;
  var merged = Object.assign({}, previous || {}, next);
  if ((previous && previous.settings) || next.settings) {
    merged.settings = Object.assign({}, (previous && previous.settings) || {}, next.settings || {});
  }
  return merged;
}

function updateRoomSettings() {
  if (!currentHostRoomCode) {
    Materialize.toast('先创建房间，再修改配置。', 3000);
    return;
  }

  var nextSettings = getHostSettingsFormValues();
  lastHostRoomData = mergeHostRoomState(lastHostRoomData, {
    settings: nextSettings,
  });
  applyRoomSettings(nextSettings);
  syncLobbyRoomPanel(lastHostRoomData);

  hostRoomSettingsEditorOpen = false;
  setHostRoomSettingsSyncState('syncing');
  refreshHostRoomModalContent();
  socket.emit('updateRoomSettings', {
    code: currentHostRoomCode,
    settings: nextSettings,
  }, function (response) {
    if (!response || response.ok !== true) {
      setHostRoomSettingsSyncState('error');
      Materialize.toast(
        (response && response.message) || '同步失败，请稍后重试。',
        3000
      );
      refreshHostRoomModalContent();
      return;
    }
    if (hostRoomSettingsSyncState === 'syncing') {
      setHostRoomSettingsSyncState('synced');
      refreshHostRoomModalContent();
    }
  });
  Materialize.toast('配置已提交，正在同步房间。', 2500);
}

function applyRoomSettings(settings) {
  if (!settings) return;
  roomSettings = settings;
}

function syncLobbyRoomPanel(data) {
  if (!data) return;
  if (typeof mergeLobbyRoomState === 'function') {
    lastLobbyRoomState = mergeLobbyRoomState(lastLobbyRoomState, data);
  } else {
    lastLobbyRoomState = Object.assign({}, lastLobbyRoomState || {}, data);
  }
  if (typeof renderLobbyRoomPanel !== 'function') return;
  var $panel = $('#lobbyRoomPanel');
  if ($panel.length) {
    $panel.html(renderLobbyRoomPanel(lastLobbyRoomState, { previousPlayers: lastLobbyPlayers }));
  }
  lastLobbyPlayers = Array.isArray(lastLobbyRoomState && lastLobbyRoomState.players)
    ? lastLobbyRoomState.players.slice()
    : null;
}

function renderRoomSettings(settings) {
  if (!settings || !settings.blinds || !settings.buyIn) return '';
  return (
    '<div class="room-settings-summary">' +
    '<div class="room-settings-summary-head">' +
    '<span class="room-settings-summary-label">配置摘要</span>' +
    '<span class="room-settings-summary-state">可直接开局</span>' +
    '</div>' +
    '<div class="room-settings-summary-body">' +
    '<span class="room-setting-chip">盲注 $' + settings.blinds.small + ' / $' + settings.blinds.big + '</span>' +
    '<span class="room-setting-chip">起始筹码 $' + settings.buyIn.startingStack + '</span>' +
    '<span class="room-setting-chip">' + (settings.buyIn.autoRebuy ? '自动补码开启' : '自动补码关闭') + '</span>' +
    (settings.buyIn.autoRebuy
      ? '<span class="room-setting-chip">补码目标 $' + settings.buyIn.autoRebuyStack + '</span>'
      : '') +
    '</div>' +
    '</div>'
  );
}

function renderRoomSettingsEditor(settings) {
  if (!settings || !settings.blinds || !settings.buyIn) return '';
  return (
    '<div class="room-settings-editor">' +
    '<div class="room-settings-editor-head">' +
    '<h5>房主配置</h5>' +
    '<p>还没开局前，房主可以随时改盲注和补码设置。</p>' +
    '</div>' +
    '<div class="room-settings-form">' +
    '<div class="input-field col s6">' +
    '<label class="active" for="smallBlind-field">小盲</label>' +
    '<input type="number" min="1" step="1" id="smallBlind-field" value="' + settings.blinds.small + '" />' +
    '</div>' +
    '<div class="input-field col s6">' +
    '<label class="active" for="bigBlind-field">大盲</label>' +
    '<input type="number" min="2" step="1" id="bigBlind-field" value="' + settings.blinds.big + '" />' +
    '</div>' +
    '<div class="input-field col s6">' +
    '<label class="active" for="startingStack-field">起始筹码</label>' +
    '<input type="number" min="100" step="10" id="startingStack-field" value="' + settings.buyIn.startingStack + '" />' +
    '</div>' +
    '<div class="input-field col s6">' +
    '<label class="active" for="autoRebuyStack-field">自动补码目标</label>' +
    '<input type="number" min="100" step="10" id="autoRebuyStack-field" value="' + settings.buyIn.autoRebuyStack + '" />' +
    '</div>' +
    '<p class="room-settings-toggle">' +
    '<input type="checkbox" id="autoRebuy-field" ' + (settings.buyIn.autoRebuy ? 'checked="checked"' : '') + ' />' +
    '<label for="autoRebuy-field">自动补码</label>' +
    '</p>' +
    '</div>' +
    '<div class="room-settings-actions">' +
    '<button type="button" class="waves-effect waves-light btn-flat modal-action-btn room-settings-save-btn" onclick="updateRoomSettings()">保存修改</button>' +
    '<button type="button" class="waves-effect waves-light btn-flat room-settings-reset-btn" onclick="resetRoomSettingsForm()">恢复默认</button>' +
    '</div>' +
    '</div>'
  );
}

function translateStatus(status) {
  var map = {
    'Their Turn': '等待操作',
    'Fold': '已弃牌',
    'Check': '过牌',
    'Call': '跟注',
    'Buy-in': '补码'
  };
  return map[status] || status;
}

function translateBlind(blind) {
  var map = {
    'Big Blind': '大盲',
    'Small Blind': '小盲'
  };
  return map[blind] || blind;
}

function translateStage(stage) {
  var map = {
    'Pre-Flop': '翻牌前',
    'Flop': '翻牌',
    'Turn': '转牌',
    'River': '河牌'
  };
  return map[stage] || stage;
}

function formatBuyIns(count) {
  if (!count || count <= 0) return '';
  return count + ' 次补码';
}

function formatOpponentAction(text, isChecked, bet) {
  if (text == 'Fold') return '已弃牌';
  if (isChecked) return '过牌';
  if (bet && bet !== 'Fold' && bet !== 'Call' && bet !== 'Check' && bet !== 'Buy-in') {
    return '下注：$' + bet;
  }
  return translateStatus(text);
}

function formatSelfCardTitle(username, myBet) {
  if (myBet == 0) return username + '｜手牌';
  return username + '｜当前下注：$' + myBet;
}

function formatBuyInSummary(count) {
  if (!count || count <= 0) return '';
  return '（' + formatBuyIns(count) + '）';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSeatPill(text, tone) {
  return '<span class="seat-chip ' + (tone || '') + '">' + escapeHtml(text) + '</span>';
}

function renderSeatCards(cards, hidden) {
  if (hidden || !cards || cards.length < 2) {
    return (
      '<div class="seat-cards seat-cards-hidden">' +
      '<div class="blankCard seat-card-back" aria-hidden="true"></div>' +
      '<div class="blankCard seat-card-back" aria-hidden="true"></div>' +
      '</div>'
    );
  }
  return '<div class="seat-cards">' + renderOpponentCard(cards[0]) + renderOpponentCard(cards[1]) + '</div>';
}

function renderPlayersList(players) {
  if (!players || !players.length) {
    return '<p class="room-player-empty">暂无玩家</p>';
  }

  return (
    '<div class="room-player-list">' +
    players
      .map(function (p, index) {
        return (
          '<div class="room-player-row">' +
          '<span class="room-player-name">' + escapeHtml(p) + '</span>' +
          '<span class="room-player-badge">P' + (index + 1) + '</span>' +
          '</div>'
        );
      })
      .join('') +
    '</div>'
  );
}

function renderStartButton(code, label) {
  return (
    '<br /><button onclick="startGame(\'' +
    code +
    '\')" type="submit" class="waves-effect waves-light btn-flat modal-action-btn">' +
    label +
    '</button>'
  );
}

socket.on('playerDisconnected', function (data) {
  Materialize.toast(data.player + ' 离开了牌桌。', 4000);
});

socket.on('hostRoom', function (data) {
  if (data != undefined) {
    applyRoomSettings(data.settings);
    syncLobbyRoomPanel(data);
    currentHostRoomCode = data.code;
    lastHostRoomData = data;
    hostRoomSettingsEditorOpen = false;
    $('#hostModalContent').html(renderHostRoomModalContent(data));
    $('#playersNames').html(renderPlayersList(data.players));
    if (data.players.length > 1) {
      $('#startGameArea').html(renderStartButton(data.code, '开始牌局'));
    } else {
      $('#startGameArea').empty();
    }
  } else {
    Materialize.toast(
      '请输入有效昵称，最多 12 个字符。',
      4000
    );
    $('#joinButton').removeClass('disabled');
  }
});

socket.on('hostRoomUpdate', function (data) {
  if (data == undefined) {
    Materialize.toast('配置更新失败，请确认你还是房主。', 3000);
    return;
  }
  applyRoomSettings(data.settings);
  syncLobbyRoomPanel(data);
  currentHostRoomCode = data.code;
  lastHostRoomData = mergeHostRoomState(lastHostRoomData, data);
  hostRoomSettingsEditorOpen = false;
  setHostRoomSettingsSyncState('synced');
  $('#playersNames').html(renderPlayersList(data.players));
  $('#hostModalContent').html(renderHostRoomModalContent(data));
  if (data.players.length > 1) {
    $('#startGameArea').html(renderStartButton(data.code, '开始牌局'));
  } else {
    $('#startGameArea').empty();
  }
});

socket.on('joinRoomUpdate', function (data) {
  applyRoomSettings(data.settings);
  syncLobbyRoomPanel(data);
  $('#startGameAreaDisconnectSituation').html(
    renderStartButton(data.code, '开始牌局')
  );
  $('#joinModalContent').html(
    '<h5>' +
      data.host +
      ' 的牌桌</h5><hr /><h5>房间玩家</h5><p>你现在是这张牌桌的房主。</p>' +
      renderRoomSettings(data.settings)
  );

  $('#playersNamesJoined').html(renderPlayersList(data.players));
});

socket.on('joinRoom', function (data) {
  if (data == undefined) {
    closeModalAndUnlock('#joinModal');
    Materialize.toast(
      '请输入有效昵称和房码。昵称需在当前牌桌内唯一，且不超过 12 个字符。',
      4000
    );
    $('#hostButton').removeClass('disabled');
  } else {
    applyRoomSettings(data.settings);
    syncLobbyRoomPanel(data);
    $('#joinModalContent').html(
      '<h5>' +
        data.host +
        ' 的牌桌</h5><hr /><h5>房间玩家</h5><p>请等待房主开始牌局。离开、刷新或返回页面都会让你断开连接。</p>' +
        renderRoomSettings(data.settings)
    );
    $('#playersNamesJoined').html(renderPlayersList(data.players));
  }
});

socket.on('dealt', function (data) {
  $('#mycards').html(
    data.cards.map(function (c) {
      return renderCard(c);
    })
  );
  $('#usernamesCards').text(formatSelfCardTitle(data.username, 0));
  $('#mainContent').addClass('is-game-hidden');
});

// --- Render scheduling (mobile perf): coalesce rapid server rerenders into one frame ---
var rerenderScheduled = false;
var pendingRerenderData = null;

function buildBetByPlayerMap(bets) {
  var lastStage = bets && bets.length ? bets[bets.length - 1] : [];
  var map = Object.create(null);
  for (var i = 0; i < lastStage.length; i++) {
    map[lastStage[i].player] = lastStage[i].bet;
  }
  return map;
}

function formatMoneyChip(value) {
  return '$' + (value == undefined ? 0 : value);
}

function renderPossibleMovesSummary(data) {
  var pills = [];
  if (!data) {
    $('#moveSummary').empty().removeClass('has-moves is-empty');
    return;
  }

  if (data.fold == 'yes') pills.push('<span class="move-pill is-muted">弃牌</span>');
  if (data.check == 'yes') pills.push('<span class="move-pill is-muted">过牌</span>');
  if (data.bet == 'yes') pills.push('<span class="move-pill is-prominent">下注</span>');
  if (data.call != 'no') {
    pills.push(
      '<span class="move-pill is-prominent">' +
        (data.call == 'all-in' ? '跟注全下' : '跟注 $' + data.call) +
        '</span>'
    );
  }
  if (data.raise == 'yes') pills.push('<span class="move-pill is-prominent">加注</span>');

  $('#moveSummary')
    .toggleClass('has-moves', pills.length > 0)
    .toggleClass('is-empty', !pills.length)
    .html(
      pills.length
        ? '<span class="move-summary-label">可选动作</span>' + pills.join('')
        : '<span class="move-pill is-muted">暂时没有可用动作</span>'
    );
}

function syncPossibleMovesControls(data) {
  renderPossibleMovesSummary(data);
  if (!data) {
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    return;
  }

  if (data.fold == 'yes') $('#usernameFold').show();
  else $('#usernameFold').hide();
  if (data.check == 'yes') $('#usernameCheck').show();
  else $('#usernameCheck').hide();
  if (data.bet == 'yes') $('#usernameBet').show();
  else $('#usernameBet').hide();
  if (data.call != 'no' || data.call == 'all-in') {
    $('#usernameCall').show();
    if (data.call == 'all-in') $('#usernameCall').text('跟注全下');
    else $('#usernameCall').text('跟注 $' + data.call);
  } else $('#usernameCall').hide();
  if (data.raise == 'yes') $('#usernameRaise').show();
  else $('#usernameRaise').hide();
}

function formatTableSubtitle(data) {
  var parts = [];
  if (data.stage) parts.push(translateStage(data.stage));
  if (data.topBet != undefined) parts.push('顶注 ' + formatMoneyChip(data.topBet));
  if (data.pot != undefined) parts.push('底池 ' + formatMoneyChip(data.pot));
  return parts.join(' · ');
}

function updateTableMetrics(data) {
  $('#stageStatus').text(translateStage(data.stage || ''));
  $('#potStatus').text(formatMoneyChip(data.pot));
  $('#topBetStatus').text(formatMoneyChip(data.topBet));

  var metrics = $('#tableMetrics .metric-chip');
  metrics.removeClass('is-updated');
  window.requestAnimationFrame(function () {
    metrics.addClass('is-updated');
  });
}

function openModalAndLock(selector) {
  var $modal = $(selector);
  if (!$modal.length) return;
  if (typeof $modal.openModal === 'function') {
    $modal.openModal();
    return;
  }
  $modal.show();
  setModalScrollLock(true);
}

function normalizeWinnerNames(winners) {
  if (Array.isArray(winners)) return winners.filter(Boolean);
  if (winners == null) return [];
  return String(winners)
    .split(',')
    .map(function (name) { return name.trim(); })
    .filter(Boolean);
}

function renderCardGroup(cards) {
  if (!cards || !cards.length) {
    return '<div class="result-cards-empty">暂无</div>';
  }
  return '<div class="result-card-group">' + cards.map(function (card) { return renderCard(card); }).join('') + '</div>';
}

function renderResultPlayerRow(player, winners, selfUsername) {
  var isWinner = winners.indexOf(player.username) >= 0;
  var isSelf = selfUsername && player.username === selfUsername;
  var chips = [];
  if (isSelf) chips.push('<span class="table-badge subtle">你</span>');
  if (isWinner) chips.push('<span class="table-badge">赢家</span>');
  if (player.gain != null) chips.push('<span class="table-badge subtle">+' + escapeHtml(player.gain) + '</span>');
  return (
    '<div class="result-player-row' + (isWinner ? ' is-winner' : '') + (isSelf ? ' is-self' : '') + '">' +
    '<div class="result-player-meta">' +
    '<div class="result-player-name">' + escapeHtml(player.username) + '</div>' +
    '<div class="result-player-subtitle">' + escapeHtml(translateStatus(player.hand || player.handName || player.text || '')) + '</div>' +
    '</div>' +
    '<div class="result-player-stack">' + escapeHtml(formatMoneyChip(player.money)) + '</div>' +
    '<div class="result-player-chips">' + chips.join('') + '</div>' +
    '</div>'
  );
}

function renderHandResultContent(data) {
  var winners = normalizeWinnerNames(data.winners || data.winner);
  var players = Array.isArray(data.cards) ? data.cards : Array.isArray(data.players) ? data.players : [];
  var selfPlayer = players.find(function (player) {
    return player.username === data.username;
  }) || null;
  var winnerLabel = winners.length > 1 ? winners.join('、') : (winners[0] || '暂无');
  var headline = winners.length > 1 ? '平分底池' : '本手赢家：' + winnerLabel;
  var summary = data.pot != null ? '底池 ' + formatMoneyChip(data.pot) : '';
  var community = Array.isArray(data.community)
    ? data.community
    : Array.isArray(data.communityCards)
    ? data.communityCards
    : Array.isArray(data.board)
    ? data.board
    : Array.isArray(data.boardCards)
    ? data.boardCards
    : [];
  var communityMarkup = renderCardGroup(community);
  var selfCards = selfPlayer && Array.isArray(selfPlayer.cards) ? selfPlayer.cards : [];
  var selfCardsMarkup = renderCardGroup(selfCards);
  var playersMarkup = players.map(function (player) {
    return renderResultPlayerRow(player, winners, data.username);
  }).join('');

  return (
    '<div class="hand-result-hero">' +
    '<span class="table-badge">' + escapeHtml(headline) + '</span>' +
    (summary ? '<p class="hand-result-summary">' + escapeHtml(summary) + '</p>' : '') +
    '</div>' +
    '<div class="hand-result-grid">' +
    '<section class="hand-result-section hand-result-board">' +
    '<div class="hand-result-section-head">' +
    '<h5>公共牌</h5>' +
    '<span class="board-chip subtle">Showdown</span>' +
    '</div>' +
    '<div class="hand-result-card-strip">' +
    communityMarkup +
    '</div>' +
    '</section>' +
    '<section class="hand-result-section hand-result-self">' +
    '<div class="hand-result-section-head">' +
    '<h5>你的手牌</h5>' +
    '<span class="board-chip subtle">你</span>' +
    '</div>' +
    '<div class="hand-result-card-strip">' +
    selfCardsMarkup +
    '</div>' +
    '</section>' +
    '<section class="hand-result-section hand-result-players">' +
    '<div class="hand-result-section-head">' +
    '<h5>结算明细</h5>' +
    '<span class="board-chip subtle">赢家 / 牌型 / 筹码</span>' +
    '</div>' +
    playersMarkup +
    '</section>' +
    '</div>'
  );
}

function showHandResultModal(data) {
  $('#handResultModalContent').html(renderHandResultContent(data));
  openModalAndLock('#handResultModal');
}

function closeHandResultModal() {
  closeModalAndUnlock('#handResultModal');
}

function closeHandResultAndPlayNext() {
  closeHandResultModal();
  playNext();
}

function doRerender(data) {
  if (!data) return;

  if (data.myBet == 0) {
    $('#usernamesCards').text(formatSelfCardTitle(data.username, 0));
  } else {
    $('#usernamesCards').text(formatSelfCardTitle(data.username, data.myBet));
  }

  var communityMarkup = data.community != undefined
    ? data.community.map(function (c) {
        return renderCard(c);
      }).join('')
    : '<p></p>';
  if (communityMarkup !== lastCommunityMarkup) {
    $('#communityCards').html(communityMarkup);
    lastCommunityMarkup = communityMarkup;
  }

  if (data.currBet == undefined) data.currBet = 0;
  var roundLabel = data.round != undefined ? data.round : '—';
  $('#table-title').text('第 ' + roundLabel + ' 手牌');
  $('#tableSubtitle').text(formatTableSubtitle(data));
  updateTableMetrics(data);
  $('#turnHint').text(data.currentTurn ? '当前玩家：' + data.currentTurn : '');

  var betByPlayer = buildBetByPlayerMap(data.bets);
  var opponentMarkup = data.players.map(function (p) {
    return renderOpponent(p.username, {
      text: p.status,
      money: p.money,
      blind: p.blind,
      bet: betByPlayer[p.username] || 0,
      buyIns: p.buyIns,
      isChecked: p.isChecked,
    });
  }).join('');
  if (opponentMarkup !== lastOpponentMarkup) {
    $('#opponentCards').html(opponentMarkup);
    lastOpponentMarkup = opponentMarkup;
  }

  renderSelf({
    money: data.myMoney,
    text: data.myStatus,
    blind: data.myBlind,
    bets: data.bets,
    buyIns: data.buyIns,
    currentTurn: data.currentTurn,
    round: data.round,
    roundInProgress: data.roundInProgress,
  });

  if (!data.roundInProgress) {
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    lastSelfTurnState = null;
    lastSelfTurnRound = null;
    lastPossibleMoves = null;
  }
}

socket.on('rerender', function (data) {
  pendingRerenderData = data;
  if (rerenderScheduled) return;
  rerenderScheduled = true;

  var raf = window.requestAnimationFrame || function (cb) { return window.setTimeout(cb, 16); };
  raf(function () {
    rerenderScheduled = false;
    var next = pendingRerenderData;
    pendingRerenderData = null;
    doRerender(next);
  });
});

socket.on('gameBegin', function (data) {
  $('body').addClass('game-active');
  $('#siteHeader').hide();
  $('#mainContent').addClass('is-game-hidden');
  closeModalAndUnlock('#joinModal');
  closeModalAndUnlock('#hostModal');
  if (data == undefined) {
    alert('错误：无效的房间。');
  } else {
    $('#gameDiv').show();
  }
});

function playNext() {
  socket.emit('startNextRound', {});
}

socket.on('reveal', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();

  for (var i = 0; i < data.winners.length; i++) {
    if (data.winners[i] == data.username) {
      Materialize.toast('你赢下了这一手。', 4000);
      break;
    }
  }
  $('#table-title').text('本手赢家：' + data.winners);
  $('#turnHint').text('');
  $('#playNext').html(
    '<button onClick=playNext() id="playNextButton" class="btn white black-text menuButtons">开始下一手</button>'
  );
  $('#blindStatus').text(translateStatus(data.hand));
  $('#usernamesMoney').text('$' + data.money);
  $('#opponentCards').html(
    data.cards.map(function (p) {
      return renderOpponentCards(p.username, {
        cards: p.cards,
        folded: p.folded,
        money: p.money,
        endHand: p.hand,
        buyIns: p.buyIns,
      });
    })
  );
  showHandResultModal(data);
  lastSelfTurnState = null;
  lastSelfTurnRound = null;
  lastPossibleMoves = null;
});

socket.on('endHand', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();
  $('#table-title').text(data.winner + ' 赢得底池 $' + data.pot);
  $('#turnHint').text('');
  $('#playNext').html(
    '<button onClick=playNext() id="playNextButton" class="btn white black-text menuButtons">开始下一手</button>'
  );
  $('#blindStatus').text('');
  if (data.folded == 'Fold') {
    $('#status').text('你已弃牌');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').addClass('grey');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
  }
  $('#usernamesMoney').text('$' + data.money);
  $('#opponentCards').html(
    data.cards.map(function (p) {
      return renderOpponent(p.username, {
        text: p.text,
        money: p.money,
        blind: '',
        bets: data.bets,
      });
    })
  );
  showHandResultModal(data);
  lastSelfTurnState = null;
  lastSelfTurnRound = null;
  lastPossibleMoves = null;
});

var beginHost = function () {
  if ($('#hostName-field').val() == '') {
    $('.toast').hide();
    closeModalAndUnlock('#hostModal');
    Materialize.toast(
      '请输入有效昵称，最多 12 个字符。',
      4000
    );
    $('#joinButton').removeClass('disabled');
  } else {
    socket.emit('host', {
      username: $('#hostName-field').val(),
      settings: getHostSettingsFormValues(),
    });
    $('#joinButton').addClass('disabled');
    $('#joinButton').off('click');
  }
};

var joinRoom = function () {
  // yes, i know this is client-side.
  if (
    $('#joinName-field').val() == '' ||
    $('#code-field').val() == '' ||
    $('#joinName-field').val().length > 12
  ) {
    $('.toast').hide();
    Materialize.toast(
      '请输入有效昵称和房码，昵称最长 12 个字符。',
      4000
    );
    closeModalAndUnlock('#joinModal');
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else {
    socket.emit('join', {
      code: $('#code-field').val(),
      username: $('#joinName-field').val(),
    });
    $('#hostButton').addClass('disabled');
    $('#hostButton').off('click');
  }
};

var startGame = function (gameCode) {
  socket.emit('startGame', { code: gameCode });
};

var fold = function () {
  socket.emit('moveMade', { move: 'fold', bet: 'Fold' });
};

var bet = function () {
  var minBet = Math.max(parseInt(roomSettings.blinds.big, 10) || 0, 1);
  var maxBet = parseInt($('#betRangeSlider').attr('max'), 10) || 0;
  var betAmount = amountControls.normalizeActionAmount(
    $('#betAmountInput').val(),
    minBet,
    maxBet
  );
  if (betAmount < minBet) {
    Materialize.toast('最小开局下注为 $' + roomSettings.blinds.big + '。', 4000);
  } else {
    socket.emit('moveMade', {
      move: 'bet',
      bet: betAmount,
    });
  }
};

function call() {
  socket.emit('moveMade', { move: 'call', bet: 'Call' });
}

var check = function () {
  socket.emit('moveMade', { move: 'check', bet: 'Check' });
};

var raise = function () {
  var raiseSlider = $('#raiseRangeSlider');
  var minRaise = parseInt(raiseSlider.attr('min'), 10) || 0;
  var maxRaise = parseInt(raiseSlider.attr('max'), 10) || 0;
  var raiseAmount = amountControls.normalizeActionAmount(
    $('#raiseAmountInput').val(),
    minRaise,
    maxRaise
  );
  var isShortStackAllInOnly = maxRaise > 0 && maxRaise <= minRaise && raiseAmount === maxRaise;
  if (raiseAmount === minRaise && !isShortStackAllInOnly) {
    Materialize.toast('加注金额必须高于当前顶注，请重试。', 4000);
  } else {
    socket.emit('moveMade', {
      move: 'raise',
      bet: raiseAmount,
    });
  }
};

function renderCard(card) {
  var cardLabel = card.value + ' ' + card.suit;
  if (card.suit == '♠' || card.suit == '♣')
    return '<div class="playingCard_black" data-value="' + cardLabel + '">' + cardLabel + '</div>';
  else return '<div class="playingCard_red" data-value="' + cardLabel + '">' + cardLabel + '</div>';
}

function renderOpponent(name, data) {
  var bet = 0;
  if (typeof data.bet !== 'undefined') {
    bet = data.bet;
  } else if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1];
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  } else if (window.gameState != null && window.gameState.players) {
    for (var p = 0; p < window.gameState.players.length; p++) {
      if (window.gameState.players[p].player == name) bet = window.gameState.players[p].bet;
    }
  }

  var isFolded = data.text == 'Fold' || data.folded;
  var isTurn = data.text == 'Their Turn';
  var isChecked = !!data.isChecked;
  var statusTone = isFolded ? 'is-muted' : isTurn ? 'is-turn' : isChecked ? 'is-muted' : 'is-prominent';
  var statusText = isFolded ? '已弃牌' : isTurn ? '待行动' : isChecked ? '已过牌' : '观察中';
  var summaryParts = [];
  var noteParts = [];

  if (data.blind) summaryParts.push(translateBlind(data.blind));
  if (bet > 0) summaryParts.push('下注 $' + bet);
  if (data.buyIns > 0) summaryParts.push(formatBuyInSummary(data.buyIns));

  noteParts.push(formatOpponentAction(data.text, data.isChecked, bet));
  if (data.endHand) noteParts.push(data.endHand);

  var noteText = noteParts.filter(Boolean).join(' · ');

  return (
    '<div class="col s12 m2 opponentCard">' +
    '<div class="card opponent-seat ' + (isFolded ? 'grey' : isTurn ? 'yellow darken-3' : 'green darken-2') + (isTurn ? ' theirTurn' : '') + '">' +
    '<div class="card-content ' + (isTurn ? 'black-text' : 'white-text') + '">' +
    '<div class="seat-headline">' +
    '<span class="card-title seat-name">' + escapeHtml(name) + '</span>' +
    '<span class="seat-state ' + statusTone + '">' + statusText + '</span>' +
    '</div>' +
    '<div class="seat-chip-row seat-compact-list">' +
    '<span class="seat-compact-item">' + escapeHtml(summaryParts.length ? summaryParts.join(' · ') : '静待更新') + '</span>' +
    '</div>' +
    '<div class="seat-notes">' +
    '<span class="seat-note-line">' + escapeHtml(noteText || '等待中') + '</span>' +
    '</div>' +
    '</div>' +
    '<div class="card-action ' + (isTurn ? 'yellow lighten-1 black-text' : 'green darken-3 white-text') + ' center-align seat-footer">' +
    '<span class="seat-money">$' + data.money + '</span>' +
    (data.buyIns > 0 ? '<span class="seat-buyins">' + formatBuyInSummary(data.buyIns) + '</span>' : '') +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

function renderOpponentCards(name, data) {
  return renderOpponent(name, data);
}

function renderOpponentCard(card) {
  var cardLabel = card.value + ' ' + card.suit;
  if (card.suit == '♠' || card.suit == '♣')
    return '<div class="playingCard_black_opponent" data-value="' + cardLabel + '">' + cardLabel + '</div>';
  else return '<div class="playingCard_red_opponent" data-value="' + cardLabel + '">' + cardLabel + '</div>';
}

function updateBetDisplay() {
  var currentMoney = parseInt($('#usernamesMoney').text().replace('$', ''), 10);
  var betSlider = $('#betRangeSlider');
  var betInput = $('#betAmountInput');
  var normalizedBet = amountControls.normalizeActionAmount(
    betInput.val() || betSlider.val(),
    0,
    parseInt(betSlider.attr('max'), 10) || currentMoney || 0
  );
  betSlider.val(normalizedBet);
  betInput.val(normalizedBet);
  if (normalizedBet === currentMoney) {
    $('#betDisplay').html('<h3 class="center-align">全下 $' + normalizedBet + '</h3>');
  } else {
    $('#betDisplay').html('<h3 class="center-align">$' + normalizedBet + '</h3>');
  }
}

function updateBetModal() {
  $('#betDisplay').html('<h3 class="center-align">$0</h3>');
  document.getElementById('betRangeSlider').value = 0;
  document.getElementById('betAmountInput').value = 0;
  var usernamesMoneyStr = $('#usernamesMoney').text().replace('$', '');
  var usernamesMoneyNum = parseInt(usernamesMoneyStr);
  $('#betRangeSlider').attr({
    max: usernamesMoneyNum,
    min: 0,
  });
  $('#betAmountInput').attr({
    max: usernamesMoneyNum,
    min: 0,
  });
}

function updateRaiseDisplay() {
  var raiseSlider = $('#raiseRangeSlider');
  var raiseInput = $('#raiseAmountInput');
  var minRaise = parseInt(raiseSlider.attr('min'), 10) || 0;
  var maxRaise = parseInt(raiseSlider.attr('max'), 10) || minRaise;
  var normalizedRaise = amountControls.normalizeActionAmount(
    raiseInput.val() || raiseSlider.val(),
    minRaise,
    maxRaise
  );
  raiseSlider.val(normalizedRaise);
  raiseInput.val(normalizedRaise);
  $('#raiseDisplay').html(
    '<h3 class="center-align">' +
      amountControls.formatActionAmountLabel(normalizedRaise, maxRaise) +
      '</h3>'
  );
}

socket.on('updateRaiseModal', function (data) {
  var baseTopBet = parseInt(data.topBet, 10) || 0;
  var blindStep = Math.max(parseInt(roomSettings.blinds.big, 10) || 0, 1);
  var minRaise = baseTopBet + blindStep;
  var maxRaise = parseInt(data.usernameMoney, 10) || 0;
  if (maxRaise < minRaise) minRaise = maxRaise;
  $('#raiseRangeSlider').attr({
    max: maxRaise,
    min: minRaise,
  });
  $('#raiseRangeSlider').val(minRaise);
  $('#raiseAmountInput').attr({
    max: maxRaise,
    min: minRaise,
  });
  $('#raiseAmountInput').val(minRaise);
  updateRaiseDisplay();
  $('#raiseHelpText').text(
    maxRaise <= minRaise
      ? '你只能全下或跟注，当前筹码不足以构成标准加注。'
      : '最小加注会按大盲注起跳，更接近真实牌桌。'
  );
});

function updateRaiseModal() {
  document.getElementById('raiseRangeSlider').value = 0;
  $('#raiseHelpText').text('正在计算可加注范围…');
  socket.emit('raiseModalData', {});
}

socket.on('displayPossibleMoves', function (data) {
  lastPossibleMoves = data;
  syncPossibleMovesControls(data);
});

function shouldRequestPossibleMoves(currentText, currentRound) {
  if (currentText === 'Their Turn') {
    const shouldEmit = lastSelfTurnState !== 'Their Turn' || lastSelfTurnRound !== currentRound;
    lastSelfTurnState = 'Their Turn';
    lastSelfTurnRound = currentRound;
    return shouldEmit;
  }
  lastSelfTurnState = currentText;
  lastSelfTurnRound = currentRound;
  return false;
}

function renderSelf(data) {
  $('#playNext').empty();
  $('#usernamesMoney').text('$' + data.money);
  if (data.text == 'Their Turn') {
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').addClass('yellow');
    $('#playerInformationCard').addClass('darken-2');
    $('#playerInformationCard').addClass('theirTurn');
    $('#commandCard').addClass('theirTurn');
    $('#usernamesCards').removeClass('white-text');
    $('#usernamesCards').addClass('black-text');
    $('#status').text('轮到你操作');
    $('#turnHint').text(
      data.currentTurn ? '当前玩家：' + data.currentTurn + ' · 轮到你操作' : '轮到你操作'
    );
    if (lastPossibleMoves && lastSelfTurnRound === data.round) {
      syncPossibleMovesControls(lastPossibleMoves);
    } else {
      syncPossibleMovesControls(null);
    }
    if (shouldRequestPossibleMoves(data.text, data.round)) {
      Materialize.toast('轮到你操作了。', 4000);
      socket.emit('evaluatePossibleMoves', {});
    }
  } else if (data.text == 'Fold') {
    lastSelfTurnState = 'Fold';
    lastSelfTurnRound = data.round;
    $('#status').text('你已弃牌');
    $('#turnHint').text('');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#commandCard').removeClass('theirTurn');
    $('#playerInformationCard').addClass('grey');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    Materialize.toast('你已弃牌。', 3000);
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    renderPossibleMovesSummary(null);
  } else {
    lastSelfTurnState = data.text;
    lastSelfTurnRound = data.round;
    $('#status').text('');
    $('#turnHint').text('');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').addClass('green');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#commandCard').removeClass('theirTurn');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    renderPossibleMovesSummary(null);
  }
  $('#blindStatus').text(translateBlind(data.blind));
}
