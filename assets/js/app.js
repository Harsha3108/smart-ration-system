// Smart Public Ration Distribution System (e-PDS) - Web Controller
// Enforces Role-Based Login Gate (Admin / Store Operator / Beneficiary)

let currentUser = null;
let currentCards = {};
let currentStores = {};
let currentOperators = {};
let currentCommodities = {
  rice: { id: 'rice', name: 'Rice', kgPerPerson: 5.0, unit: 'kg', stockKg: 500.0 },
  ragi: { id: 'ragi', name: 'Ragi', kgPerPerson: 5.0, unit: 'kg', stockKg: 500.0 }
};
let currentTransactions = {};
let currentActiveSession = {};
let currentConfig = {
  demoMode: true,
  demoRatio: 100,
  calibrationFactor: 420.5,
  servoClosedAngle: 0,
  servoOpenAngle: 60,
  adminCredentials: { username: 'admin@pds.gov.in', password: 'Admin@2026' }
};

let activeAdminTab = 'beneficiaries';
let activeOperatorCardId = null;
let generatedOtpCode = null;
let activeCameraRowElement = null;
let activeCameraStream = null;
let simStage2Resolver = null;

// Initial Seed Data (Synced with database/firebase_data_seed.json)
const DEFAULT_SEED_DATA = {
  stores: {
    "FPS_KA_BLR_042": { storeId: "FPS_KA_BLR_042", name: "Fair Price Shop #42 (Gandhi Nagar)", address: "Ward 4, 3rd Cross, Gandhi Nagar, Bengaluru, Karnataka - 560009", location: "12.9716, 77.5946", contactPhone: "+919876543200", active: true },
    "FPS_KA_BLR_088": { storeId: "FPS_KA_BLR_088", name: "Fair Price Shop #88 (Indiranagar)", address: "Ward 12, 100ft Road, Indiranagar, Bengaluru, Karnataka - 560038", location: "12.9784, 77.6408", contactPhone: "+919876543201", active: true },
    "FPS_KA_BLR_105": { storeId: "FPS_KA_BLR_105", name: "Fair Price Shop #105 (Jayanagar)", address: "Ward 22, 4th Block, Jayanagar, Bengaluru, Karnataka - 560011", location: "12.9250, 77.5938", contactPhone: "+919876543202", active: true }
  },
  operators: {
    "OP_101": { operatorId: "OP_101", name: "Kiran Rao", email: "operator1@pds.gov.in", password: "Operator@101", storeId: "FPS_KA_BLR_042", phone: "+919876543299", active: true },
    "OP_102": { operatorId: "OP_102", name: "Meena Devi", email: "operator2@pds.gov.in", password: "Operator@102", storeId: "FPS_KA_BLR_088", phone: "+919876543298", active: true },
    "OP_103": { operatorId: "OP_103", name: "Arjun Nair", email: "operator3@pds.gov.in", password: "Operator@103", storeId: "FPS_KA_BLR_105", phone: "+919876543297", active: true }
  },
  commodities: {
    rice: { id: "rice", name: "Rice", kgPerPerson: 5.0, unit: "kg", stockKg: 500.0 },
    ragi: { id: "ragi", name: "Ragi", kgPerPerson: 5.0, unit: "kg", stockKg: 500.0 }
  },
  cards: {
    "RC101": {
      cardId: "RC101", rfidUid: "B37A4C12", headName: "Ramesh Kumar", phone: "+919876543210",
      address: "Ward 4, Block B, Main Street, Bengaluru", assignedStoreId: "FPS_KA_BLR_042", category: "BPL",
      allocatedRiceKg: 10.0, allocatedRagiKg: 10.0, allocatedQuotaKg: 20.0, status: "Eligible",
      distributedThisMonth: false, lastDistributionDate: "", membersCount: 2,
      members: {
        "M101_1": { memberId: "M101_1", name: "Ramesh Kumar", relation: "Head (Self)", age: 46, gender: "Male", fpId: 1, photoUrl: "" },
        "M101_2": { memberId: "M101_2", name: "Sunita Kumar", relation: "Spouse", age: 42, gender: "Female", fpId: 2, photoUrl: "" }
      },
      loginCredentials: { userId: "RC101", password: "Ration@101" }
    },
    "RC102": {
      cardId: "RC102", rfidUid: "D49F2188", headName: "Rajesh Patel", phone: "+919876543211",
      address: "Ward 7, Plot 14, Gandhi Nagar, Bengaluru", assignedStoreId: "FPS_KA_BLR_042", category: "AAY",
      allocatedRiceKg: 15.0, allocatedRagiKg: 15.0, allocatedQuotaKg: 30.0, status: "Eligible",
      distributedThisMonth: false, lastDistributionDate: "", membersCount: 3,
      members: {
        "M102_1": { memberId: "M102_1", name: "Rajesh Patel", relation: "Head (Self)", age: 50, gender: "Male", fpId: 3, photoUrl: "" },
        "M102_2": { memberId: "M102_2", name: "Priya Patel", relation: "Spouse", age: 47, gender: "Female", fpId: 4, photoUrl: "" },
        "M102_3": { memberId: "M102_3", name: "Amit Patel", relation: "Son", age: 21, gender: "Male", fpId: 5, photoUrl: "" }
      },
      loginCredentials: { userId: "RC102", password: "Ration@102" }
    },
    "RC103": {
      cardId: "RC103", rfidUid: "71A83B5E", headName: "Suresh Sharma", phone: "+919876543212",
      address: "Ward 12, House 89, Subhash Nagar, Bengaluru", assignedStoreId: "FPS_KA_BLR_088", category: "BPL",
      allocatedRiceKg: 20.0, allocatedRagiKg: 20.0, allocatedQuotaKg: 40.0, status: "Eligible",
      distributedThisMonth: false, lastDistributionDate: "", membersCount: 4,
      members: {
        "M103_1": { memberId: "M103_1", name: "Suresh Sharma", relation: "Head (Self)", age: 55, gender: "Male", fpId: 6, photoUrl: "" },
        "M103_2": { memberId: "M103_2", name: "Geeta Sharma", relation: "Spouse", age: 51, gender: "Female", fpId: 7, photoUrl: "" },
        "M103_3": { memberId: "M103_3", name: "Rahul Sharma", relation: "Son", age: 26, gender: "Male", fpId: 8, photoUrl: "" },
        "M103_4": { memberId: "M103_4", name: "Anita Sharma", relation: "Daughter", age: 23, gender: "Female", fpId: 9, photoUrl: "" }
      },
      loginCredentials: { userId: "RC103", password: "Ration@103" }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initFirebaseListeners();
  renderSmsLogs();
  restoreSessionIfPresent();
});

// =========================================================================
// AUTHENTICATION GATE & ROLE ISOLATION
// =========================================================================
function selectLoginHint(role) {
  ['admin', 'operator'].forEach(r => {
    const btn = document.getElementById(`role-hint-${r}`);
    if (btn) {
      btn.className = r === role
        ? 'py-1.5 rounded bg-white text-slate-900 shadow-sm'
        : 'py-1.5 rounded text-slate-600 hover:text-slate-900';
    }
  });
  const idInput = document.getElementById('login-identifier');
  const idLabel = document.getElementById('login-id-label');
  if (role === 'admin') {
    idLabel.innerText = 'Administrator Email';
    idInput.placeholder = 'admin@pds.gov.in';
  } else {
    idLabel.innerText = 'Distributor Email';
    idInput.placeholder = 'operator1@pds.gov.in';
  }
}

function handleCredentialLogin(e) {
  e.preventDefault();
  const id = document.getElementById('login-identifier').value.trim();
  const pwd = document.getElementById('login-password').value;
  const errBox = document.getElementById('login-error-box');
  errBox.classList.add('hidden');

  const adminUser = currentConfig.adminCredentials?.username || 'admin@pds.gov.in';
  const adminPwd = currentConfig.adminCredentials?.password || 'Admin@2026';

  // 1. Administrator Login
  if ((id.toLowerCase() === adminUser.toLowerCase() && pwd === adminPwd) ||
      (id.toLowerCase() === 'admin@pds.gov.in' && pwd === 'Admin@2026') ||
      (id.toLowerCase() === 'admin@smartration.gov' && pwd === 'Admin@Ration2026')) {
    completeLogin({ role: 'admin', id: adminUser, name: 'State Administrator', storeId: 'FPS_KA_BLR_042' });
    return;
  }

  // 2. Store Distribution Operator / Distributor Login
  const opsSource = Object.keys(currentOperators).length ? currentOperators : DEFAULT_SEED_DATA.operators;
  const op = Object.values(opsSource).find(o => o.email && o.email.toLowerCase() === id.toLowerCase() && o.password === pwd);
  if (op) {
    completeLogin({ role: 'operator', id: op.operatorId, name: op.name, storeId: op.storeId });
    return;
  }

  errBox.innerText = 'Access denied. Only authorized Administrators or Fair Price Shop Distributors can sign in.';
  errBox.classList.remove('hidden');
}

function completeLogin(userObj) {
  currentUser = userObj;
  sessionStorage.setItem('pds_session_user', JSON.stringify(userObj));
  document.getElementById('login-form').reset();
  applyAuthenticatedView();
  showToast(`Signed in as ${userObj.name}`, 'success');
}

function restoreSessionIfPresent() {
  try {
    const raw = sessionStorage.getItem('pds_session_user');
    if (raw) {
      currentUser = JSON.parse(raw);
      applyAuthenticatedView();
      return;
    }
  } catch (_) {}
  showLoginGate();
}

function showLoginGate() {
  currentUser = null;
  document.getElementById('auth-gate').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('header-auth-controls').classList.add('hidden');
}

function logoutUser() {
  sessionStorage.removeItem('pds_session_user');
  activeOperatorCardId = null;
  showLoginGate();
  showToast('Signed out securely.', 'info');
}

function applyAuthenticatedView() {
  if (!currentUser) return showLoginGate();

  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('header-auth-controls').classList.remove('hidden');

  document.getElementById('header-user-name').innerText = currentUser.name;
  const roleMap = { admin: 'Super Administrator', operator: `Distributor (${currentUser.storeId})` };
  document.getElementById('header-user-role').innerText = roleMap[currentUser.role] || 'Authorized User';

  const btnBroadcast = document.getElementById('btn-broadcast-sms');
  const adminSwitcher = document.getElementById('admin-portal-switcher');

  if (currentUser.role === 'admin') {
    btnBroadcast.classList.remove('hidden');
    adminSwitcher.classList.remove('hidden');
    switchPortal('admin');
  } else if (currentUser.role === 'operator') {
    btnBroadcast.classList.add('hidden');
    adminSwitcher.classList.add('hidden');
    switchPortal('operator');
  } else {
    showLoginGate();
  }
}

// =========================================================================
// FIREBASE REALTIME LISTENERS
// =========================================================================
function initFirebaseListeners() {
  if (!window.db) {
    currentCards = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.cards));
    currentStores = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.stores));
    currentOperators = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.operators));
    currentCommodities = JSON.parse(JSON.stringify(DEFAULT_SEED_DATA.commodities));
    refreshAllViews();
    return;
  }

  window.db.ref('stores').on('value', (snap) => {
    const val = snap.val();
    if (val) { currentStores = val; }
    else { window.db.ref('stores').set(DEFAULT_SEED_DATA.stores); currentStores = DEFAULT_SEED_DATA.stores; }
    renderStoresAndOperators();
    populateStoreDropdowns();
    updateSummaryStats();
    if (currentUser?.role === 'operator') updateOperatorStoreBanner();
  });

  window.db.ref('operators').on('value', (snap) => {
    const val = snap.val();
    if (val) { currentOperators = val; }
    else { window.db.ref('operators').set(DEFAULT_SEED_DATA.operators); currentOperators = DEFAULT_SEED_DATA.operators; }
    renderStoresAndOperators();
  });

  window.db.ref('commodities').on('value', (snap) => {
    const val = snap.val();
    if (val) { currentCommodities = val; }
    else { window.db.ref('commodities').set(DEFAULT_SEED_DATA.commodities); currentCommodities = DEFAULT_SEED_DATA.commodities; }
    updateCommodityUI();
    updateSummaryStats();
  });

  window.db.ref('cards').on('value', (snap) => {
    const val = snap.val();
    if (val) { currentCards = val; }
    else { window.db.ref('cards').set(DEFAULT_SEED_DATA.cards); currentCards = DEFAULT_SEED_DATA.cards; }
    renderCards();
    updateSummaryStats();
    if (activeOperatorCardId && currentCards[activeOperatorCardId]) operatorLoadCard(activeOperatorCardId);
  });

  window.db.ref('transactions').on('value', (snap) => {
    currentTransactions = snap.val() || {};
    renderTransactions();
  });

  window.db.ref('active_session').on('value', (snap) => {
    const data = snap.val();
    if (data) {
      currentActiveSession = data;
      renderActiveSession(data);
      if (data.currentCardId && currentUser?.role === 'operator' && activeOperatorCardId !== data.currentCardId) {
        operatorLoadCard(data.currentCardId);
      }
    }
  });

  window.db.ref('system_config').on('value', (snap) => {
    const data = snap.val();
    if (data) {
      currentConfig = { ...currentConfig, ...data };
      const calInput = document.getElementById('setting-calib-factor');
      const demoToggle = document.getElementById('setting-demo-mode');
      const demoRatio = document.getElementById('setting-demo-ratio');
      const demoPill = document.getElementById('demo-mode-pill');
      if (calInput && data.calibrationFactor) calInput.value = data.calibrationFactor;
      if (demoToggle) demoToggle.checked = data.demoMode !== false;
      if (demoRatio && data.demoRatio) demoRatio.value = String(data.demoRatio);
      if (demoPill) {
        demoPill.innerText = data.demoMode ? `DEMO SCALE 1:${data.demoRatio || 100}` : 'FULL SCALE 1:1';
      }
    }
  });
}

function refreshAllViews() {
  renderCards();
  renderStoresAndOperators();
  populateStoreDropdowns();
  updateCommodityUI();
  updateSummaryStats();
}

// =========================================================================
// FORMAL INITIALS PORTRAIT GENERATOR (No external cartoon URLs)
// =========================================================================
function defaultAvatarUrl(name) {
  const clean = (name || 'Citizen').trim();
  const parts = clean.split(/\s+/);
  const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'ID';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0"/><circle cx="60" cy="44" r="20" fill="#94a3b8"/><path d="M24 106c0-20 16-32 36-32s36 12 36 32" fill="#94a3b8"/><rect x="4" y="4" width="112" height="112" fill="none" stroke="#cbd5e1" stroke-width="2"/><text x="108" y="22" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#334155" text-anchor="end">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// =========================================================================
// LIVE TELEMETRY RENDERER
// =========================================================================
function renderActiveSession(s) {
  const stepBadge = document.getElementById('telemetry-step');
  const cardElem = document.getElementById('telemetry-card');
  const consumerElem = document.getElementById('telemetry-consumer');
  const fpElem = document.getElementById('telemetry-fp');
  const fpStatus = document.getElementById('telemetry-fp-status');
  const commElem = document.getElementById('telemetry-commodity');
  const gateElem = document.getElementById('telemetry-gate');
  const gateDetail = document.getElementById('telemetry-gate-detail');
  const gateIcon = document.getElementById('servo-gate-icon');
  const weightCurrent = document.getElementById('weight-current');
  const weightPhys = document.getElementById('weight-physical-grams');
  const weightTarget = document.getElementById('weight-target');
  const progressBar = document.getElementById('weight-progress-bar');
  const percentageElem = document.getElementById('dispense-percentage');
  const liveMsg = document.getElementById('status-live-message');
  const btnStage2 = document.getElementById('btn-confirm-stage2');

  if (!stepBadge) return;
  const step = s.currentStep || 'IDLE';
  stepBadge.innerText = step;
  stepBadge.className = (step === 'DISPENSING' || step === 'WAITING_STAGE2')
    ? 'px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300'
    : (step === 'COMPLETED' || step === 'SUCCESS')
      ? 'px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300'
      : (step === 'ERROR')
        ? 'px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300'
        : 'px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200';

  cardElem.innerText = s.currentCardId || s.currentCardUid || 'WAITING';
  consumerElem.innerText = s.consumerName || 'No card tapped';

  if (s.authorizedBy === 'OTP') {
    fpElem.innerText = 'OTP VERIFIED';
    fpStatus.innerText = 'Mobile OTP Authorized';
  } else if (s.matchedFpId && s.matchedFpId > 0) {
    fpElem.innerText = `FP #${s.matchedFpId}`;
    fpStatus.innerText = 'Biometric Verified';
  } else {
    fpElem.innerText = '--';
    fpStatus.innerText = 'Fingerprint / OTP';
  }

  commElem.innerText = s.currentCommodity ? s.currentCommodity.toUpperCase() : '--';

  if (s.gateStatus === 'OPEN' || s.servoAngle === 60) {
    gateElem.innerText = '60 deg (OPEN)';
    gateDetail.innerText = 'Funnel open & pouring';
    if (gateIcon) gateIcon.className = 'inline-block transform gate-indicator gate-open text-amber-700';
  } else {
    gateElem.innerText = '0 deg (CLOSED)';
    gateDetail.innerText = 'Valve sealed';
    if (gateIcon) gateIcon.className = 'inline-block transform gate-indicator gate-closed text-slate-600';
  }

  if (btnStage2) {
    if (step === 'WAITING_STAGE2' && !s.stage2Confirmed) btnStage2.classList.remove('hidden');
    else btnStage2.classList.add('hidden');
  }

  const curWt = parseFloat(s.currentWeightKg || 0);
  const tgtWt = parseFloat(s.quotaTargetKg || 0);
  const ratio = currentConfig.demoMode ? (currentConfig.demoRatio || 100) : 1;
  const physGrams = s.physicalGrams !== undefined ? parseFloat(s.physicalGrams) : (curWt * 1000 / ratio);

  weightCurrent.innerText = `${curWt.toFixed(2)} kg`;
  weightPhys.innerText = `(${physGrams.toFixed(0)} g physical)`;
  weightTarget.innerText = `${tgtWt.toFixed(2)} kg`;

  const pct = tgtWt > 0 ? Math.min(100, Math.round((curWt / tgtWt) * 100)) : 0;
  progressBar.style.width = `${pct}%`;
  percentageElem.innerText = `${pct}%`;
  liveMsg.innerText = s.message || 'ESP32 Ready: Waiting for RFID Card or Operator Verification.';
}

// =========================================================================
// SUMMARY STATS & COMMODITIES
// =========================================================================
function updateSummaryStats() {
  const cards = Object.values(currentCards);
  let totalMembers = 0, distCount = 0;
  cards.forEach(c => {
    totalMembers += c.members ? Object.keys(c.members).length : (c.membersCount || 0);
    if (c.distributedThisMonth) distCount++;
  });
  const ricePerP = currentCommodities.rice ? currentCommodities.rice.kgPerPerson : 5;
  const ragiPerP = currentCommodities.ragi ? currentCommodities.ragi.kgPerPerson : 5;

  document.getElementById('stat-total-cards').innerText = cards.length;
  document.getElementById('stat-total-members').innerText = totalMembers;
  document.getElementById('stat-distributed-count').innerText = `${distCount} / ${cards.length}`;
  document.getElementById('stat-total-stores').innerText = Object.keys(currentStores).length;
  document.getElementById('stat-quota-rate').innerText = `${ricePerP}kg Rice + ${ragiPerP}kg Ragi`;
  document.getElementById('sms-recipient-count').innerText = `${cards.length} Families`;
}

function updateCommodityUI() {
  if (currentCommodities.rice) {
    document.getElementById('comm-rice-kg').value = currentCommodities.rice.kgPerPerson;
    document.getElementById('comm-rice-stock').value = currentCommodities.rice.stockKg;
  }
  if (currentCommodities.ragi) {
    document.getElementById('comm-ragi-kg').value = currentCommodities.ragi.kgPerPerson;
    document.getElementById('comm-ragi-stock').value = currentCommodities.ragi.stockKg;
  }
}

function saveCommoditySettings() {
  const riceKgPerPerson = parseFloat(document.getElementById('comm-rice-kg').value) || 5.0;
  const riceStock = parseFloat(document.getElementById('comm-rice-stock').value) || 500.0;
  const ragiKgPerPerson = parseFloat(document.getElementById('comm-ragi-kg').value) || 5.0;
  const ragiStock = parseFloat(document.getElementById('comm-ragi-stock').value) || 500.0;

  const newComm = {
    rice: { id: 'rice', name: 'Rice', kgPerPerson: riceKgPerPerson, unit: 'kg', stockKg: riceStock },
    ragi: { id: 'ragi', name: 'Ragi', kgPerPerson: ragiKgPerPerson, unit: 'kg', stockKg: ragiStock }
  };
  currentCommodities = newComm;

  const updates = { commodities: newComm };
  Object.keys(currentCards).forEach(cid => {
    const card = currentCards[cid];
    const count = card.members ? Object.keys(card.members).length : (card.membersCount || 1);
    const riceQ = count * riceKgPerPerson;
    const ragiQ = count * ragiKgPerPerson;
    card.allocatedRiceKg = riceQ;
    card.allocatedRagiKg = ragiQ;
    card.allocatedQuotaKg = riceQ + ragiQ;
    updates[`cards/${cid}/allocatedRiceKg`] = riceQ;
    updates[`cards/${cid}/allocatedRagiKg`] = ragiQ;
    updates[`cards/${cid}/allocatedQuotaKg`] = riceQ + ragiQ;
  });

  if (window.db) {
    window.db.ref().update(updates).then(() => showToast('Grocery rules saved and card quotas recalculated.', 'success'));
  }
}

// =========================================================================
// RATION CARDS CRUD & MEMBER PHOTOS
// =========================================================================
function renderCards(filterQuery = '') {
  const container = document.getElementById('cards-container');
  if (!container) return;
  const q = filterQuery.toLowerCase().trim();
  const filtered = Object.values(currentCards).filter(c => !q ||
    (c.cardId && c.cardId.toLowerCase().includes(q)) ||
    (c.rfidUid && c.rfidUid.toLowerCase().includes(q)) ||
    (c.headName && c.headName.toLowerCase().includes(q)));

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 glass-card rounded-xl">No ration cards found.</div>`;
    return;
  }

  container.innerHTML = filtered.map(card => {
    const isCollected = card.distributedThisMonth;
    const membersList = card.members ? Object.values(card.members) : [];
    const riceQ = card.allocatedRiceKg !== undefined ? card.allocatedRiceKg : (membersList.length * 5);
    const ragiQ = card.allocatedRagiKg !== undefined ? card.allocatedRagiKg : (membersList.length * 5);

    return `
      <div class="glass-card rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 font-mono text-base">${card.cardId}</span>
                <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 border border-slate-300 text-slate-800">${card.category || 'BPL'}</span>
              </div>
              <p class="text-[11px] text-slate-500 font-mono">UID: <strong>${card.rfidUid}</strong> | ${card.assignedStoreId || 'FPS_KA_BLR_042'}</p>
            </div>
            <span class="px-2.5 py-0.5 rounded text-[11px] font-bold ${isCollected ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
              ${isCollected ? 'DISTRIBUTED' : 'ELIGIBLE'}
            </span>
          </div>

          <div class="space-y-1 py-2 border-y border-slate-200 my-2 text-xs">
            <div class="flex justify-between"><span class="text-slate-500">Head:</span><span class="font-bold text-slate-900">${card.headName}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Mobile:</span><span class="font-mono text-slate-700">${card.phone}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Entitlement:</span><span class="font-bold text-blue-900">${riceQ}kg Rice + ${ragiQ}kg Ragi</span></div>
          </div>

          <div class="mt-2">
            <p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Family Members (${membersList.length})</p>
            <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              ${membersList.map(m => `
                <div class="flex justify-between items-center text-xs bg-slate-50 p-1.5 rounded border border-slate-200">
                  <div class="flex items-center gap-2 min-w-0">
                    <img src="${m.photoUrl || defaultAvatarUrl(m.name)}" alt="${m.name}" class="w-7 h-7 rounded object-cover border border-slate-300 shrink-0 bg-white">
                    <div class="truncate">
                      <span class="font-semibold text-slate-800 block truncate">${m.name}</span>
                      <span class="text-[10px] text-slate-500">${m.relation} &bull; Age ${m.age || 30}</span>
                    </div>
                  </div>
                  <span class="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded text-[11px] border border-slate-300 shrink-0">FP #${m.fpId}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between gap-1.5">
          <button onclick="toggleCardStatus('${card.cardId}')" class="px-2.5 py-1.5 text-xs font-semibold rounded border ${isCollected ? 'border-emerald-300 text-emerald-800 hover:bg-emerald-50' : 'border-amber-300 text-amber-800 hover:bg-amber-50'}">
            ${isCollected ? 'Allow Redistribution' : 'Mark Distributed'}
          </button>
          <div class="flex items-center gap-1">
            <button onclick="simulateHardwareDispense('${card.cardId}', 'BIOMETRIC')" title="Test Sequential Dispense" class="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded"><i data-lucide="play-circle" class="w-4 h-4"></i></button>
            <button onclick="openEditCardModal('${card.cardId}')" title="Edit Card & Photos" class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
            <button onclick="deleteCard('${card.cardId}')" title="Delete Card" class="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function filterCards() { renderCards(document.getElementById('search-cards').value); }

function populateStoreDropdowns() {
  const opts = Object.values(currentStores).map(s => `<option value="${s.storeId}">${s.storeId} - ${s.name}</option>`).join('');
  const cSel = document.getElementById('input-assigned-store');
  const oSel = document.getElementById('input-op-store');
  if (cSel) cSel.innerHTML = opts;
  if (oSel) oSel.innerHTML = opts;
}

function addMemberRow(member = null) {
  const container = document.getElementById('members-form-container');
  const idx = container.children.length + 1;
  const mName = member ? member.name : '';
  const mRel = member ? member.relation : (idx === 1 ? 'Head (Self)' : 'Family Member');
  const mAge = member ? (member.age || 30) : 30;
  const mFpId = member ? member.fpId : idx;
  const mPhoto = (member && member.photoUrl) ? member.photoUrl : '';

  const div = document.createElement('div');
  div.className = 'flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 member-row';
  div.innerHTML = `
    <div class="flex items-center gap-2 shrink-0">
      <img src="${mPhoto || defaultAvatarUrl(mName || 'ID')}" class="member-photo-preview w-10 h-10 rounded object-cover border border-slate-300 bg-white">
      <input type="hidden" class="member-photo-url" value="${mPhoto}">
      <div class="flex flex-col gap-1">
        <label class="cursor-pointer px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-300 rounded hover:bg-slate-100 text-center">
          Upload
          <input type="file" accept="image/*" class="hidden" onchange="handleMemberPhotoUpload(this)">
        </label>
        <button type="button" onclick="openCameraForRow(this)" class="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-800 border border-slate-300 rounded hover:bg-slate-300">
          Camera
        </button>
      </div>
    </div>
    <input type="text" placeholder="Full Name" value="${mName}" required class="member-name flex-1 min-w-[120px] p-1.5 text-xs rounded border border-slate-300 bg-white">
    <select class="member-relation w-28 p-1.5 text-xs rounded border border-slate-300 bg-white">
      <option value="Head (Self)" ${mRel.includes('Head') ? 'selected' : ''}>Head (Self)</option>
      <option value="Spouse" ${mRel === 'Spouse' ? 'selected' : ''}>Spouse</option>
      <option value="Son" ${mRel === 'Son' ? 'selected' : ''}>Son</option>
      <option value="Daughter" ${mRel === 'Daughter' ? 'selected' : ''}>Daughter</option>
      <option value="Parent" ${mRel === 'Parent' ? 'selected' : ''}>Parent</option>
      <option value="Other" ${mRel === 'Other' ? 'selected' : ''}>Other</option>
    </select>
    <input type="number" min="1" max="120" value="${mAge}" title="Age" class="member-age w-14 p-1.5 text-xs rounded border border-slate-300 font-mono bg-white">
    <div class="flex items-center gap-1">
      <span class="text-[10px] font-bold text-slate-500">FP#</span>
      <input type="number" min="1" max="127" value="${mFpId}" required class="member-fpid w-12 p-1.5 text-xs rounded border border-slate-300 font-mono font-bold text-slate-900 bg-white">
      <button type="button" onclick="triggerRemoteFingerprintEnroll(this)" title="Enroll finger on ESP32 R307 sensor" class="enroll-fp-btn px-2 py-1 text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap">
        Enroll
      </button>
    </div>
    <button type="button" onclick="this.closest('.member-row').remove()" class="p-1 text-slate-400 hover:text-rose-700"><i data-lucide="trash" class="w-4 h-4"></i></button>
  `;
  container.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function handleMemberPhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const row = input.closest('.member-row');
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 180;
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxDim) { h *= maxDim / w; w = maxDim; } }
      else { if (h > maxDim) { w *= maxDim / h; h = maxDim; } }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      row.querySelector('.member-photo-preview').src = dataUrl;
      row.querySelector('.member-photo-url').value = dataUrl;
      showToast('Member photo uploaded.', 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function openCameraForRow(btn) {
  activeCameraRowElement = btn.closest('.member-row');
  const video = document.getElementById('camera-video');
  openModal('modal-camera');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } })
      .then(stream => { activeCameraStream = stream; video.srcObject = stream; })
      .catch(err => { showToast('Camera unavailable: ' + err.message, 'error'); closeCameraModal(); });
  } else { showToast('Camera API not supported.', 'error'); closeCameraModal(); }
}

function captureCameraSnapshot() {
  if (!activeCameraRowElement) return;
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  canvas.width = 180;
  canvas.height = 135;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  activeCameraRowElement.querySelector('.member-photo-preview').src = dataUrl;
  activeCameraRowElement.querySelector('.member-photo-url').value = dataUrl;
  showToast('Photo captured from webcam.', 'success');
  closeCameraModal();
}

function closeCameraModal() {
  if (activeCameraStream) { activeCameraStream.getTracks().forEach(t => t.stop()); activeCameraStream = null; }
  closeModal('modal-camera');
}

function openAddCardModal() {
  populateStoreDropdowns();
  document.getElementById('modal-card-title').innerText = 'Add New Ration Card';
  document.getElementById('edit-card-id-key').value = '';
  document.getElementById('form-ration-card').reset();
  document.getElementById('input-card-id').removeAttribute('readonly');
  document.getElementById('members-form-container').innerHTML = '';
  addMemberRow({ name: '', relation: 'Head (Self)', age: 40, fpId: 1 });
  openModal('modal-card');
}

function openEditCardModal(cardId) {
  const card = currentCards[cardId];
  if (!card) return;
  populateStoreDropdowns();
  document.getElementById('modal-card-title').innerText = `Edit Ration Card (${cardId})`;
  document.getElementById('edit-card-id-key').value = cardId;
  document.getElementById('input-card-id').value = card.cardId;
  document.getElementById('input-card-id').setAttribute('readonly', 'true');
  document.getElementById('input-rfid-uid').value = card.rfidUid || '';
  document.getElementById('input-assigned-store').value = card.assignedStoreId || 'FPS_KA_BLR_042';
  document.getElementById('input-head-name').value = card.headName || '';
  document.getElementById('input-phone').value = card.phone || '';
  document.getElementById('input-category').value = card.category || 'BPL';
  document.getElementById('input-address').value = card.address || '';

  const container = document.getElementById('members-form-container');
  container.innerHTML = '';
  if (card.members) Object.values(card.members).forEach(m => addMemberRow(m));
  openModal('modal-card');
}

function handleSaveCard(e) {
  e.preventDefault();
  const editKey = document.getElementById('edit-card-id-key').value;
  const cardId = document.getElementById('input-card-id').value.trim().toUpperCase();
  const rfidUid = document.getElementById('input-rfid-uid').value.trim().toUpperCase();
  const assignedStoreId = document.getElementById('input-assigned-store').value;
  const headName = document.getElementById('input-head-name').value.trim();
  const phone = document.getElementById('input-phone').value.trim();
  const category = document.getElementById('input-category').value;
  const address = document.getElementById('input-address').value.trim();

  const members = {};
  document.querySelectorAll('.member-row').forEach((row, idx) => {
    const mId = `M_${cardId}_${idx + 1}`;
    const name = row.querySelector('.member-name').value.trim();
    const relation = row.querySelector('.member-relation').value;
    const age = parseInt(row.querySelector('.member-age').value, 10) || 30;
    const fpId = parseInt(row.querySelector('.member-fpid').value, 10);
    const photoUrl = row.querySelector('.member-photo-url').value || '';
    members[mId] = { memberId: mId, name, relation, age, fpId, photoUrl };
  });

  const count = Object.keys(members).length;
  const ricePerP = currentCommodities.rice ? currentCommodities.rice.kgPerPerson : 5;
  const ragiPerP = currentCommodities.ragi ? currentCommodities.ragi.kgPerPerson : 5;
  const riceQ = count * ricePerP;
  const ragiQ = count * ragiPerP;

  const existing = (editKey && currentCards[editKey]) ? currentCards[editKey] : {};
  const cardData = {
    ...existing,
    cardId, rfidUid, assignedStoreId, headName, phone, category, address,
    membersCount: count, members, allocatedRiceKg: riceQ, allocatedRagiKg: ragiQ, allocatedQuotaKg: riceQ + ragiQ,
    status: existing.status || 'Eligible',
    distributedThisMonth: existing.distributedThisMonth || false,
    lastDistributionDate: existing.lastDistributionDate || ''
  };

  if (window.db) window.db.ref(`cards/${cardId}`).set(cardData).then(() => showToast(`Card ${cardId} saved.`, 'success'));
  else { currentCards[cardId] = cardData; renderCards(); updateSummaryStats(); }
  closeModal('modal-card');
}

function deleteCard(cardId) {
  if (!confirm(`Delete ration card ${cardId}?`)) return;
  if (window.db) window.db.ref(`cards/${cardId}`).remove();
  showToast(`Card ${cardId} deleted.`, 'info');
}

function toggleCardStatus(cardId) {
  const card = currentCards[cardId];
  if (!card) return;
  const newStatus = !card.distributedThisMonth;
  if (window.db) window.db.ref(`cards/${cardId}`).update({ distributedThisMonth: newStatus, status: newStatus ? 'Distributed' : 'Eligible' });
}

function resetAllMonthlyStatus() {
  if (!confirm('Reset all cards to Eligible for the new distribution cycle?')) return;
  const updates = {};
  Object.keys(currentCards).forEach(id => {
    updates[`cards/${id}/distributedThisMonth`] = false;
    updates[`cards/${id}/status`] = 'Eligible';
  });
  if (window.db) window.db.ref().update(updates).then(() => showToast('All monthly quotas reset.', 'success'));
}

// =========================================================================
// STORES & OPERATORS CRUD
// =========================================================================
function renderStoresAndOperators() {
  const storesEl = document.getElementById('stores-list-container');
  const opsEl = document.getElementById('operators-list-container');
  if (storesEl) {
    storesEl.innerHTML = Object.values(currentStores).map(s => `
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start gap-2">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs text-slate-900">${s.name}</span>
            <span class="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-mono text-[10px] font-bold">${s.storeId}</span>
          </div>
          <p class="text-[11px] text-slate-600 mt-0.5">${s.address}</p>
          <p class="text-[10px] text-slate-400 font-mono mt-0.5">GPS: ${s.location || '--'} | Tel: ${s.contactPhone || '--'}</p>
        </div>
        <button onclick="deleteStore('${s.storeId}')" class="p-1 text-slate-400 hover:text-rose-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>
    `).join('');
  }
  if (opsEl) {
    opsEl.innerHTML = Object.values(currentOperators).map(o => {
      const store = currentStores[o.storeId];
      return `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center gap-2">
          <div>
            <p class="font-bold text-xs text-slate-900">${o.name} <span class="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">${o.storeId}</span></p>
            <p class="text-[11px] text-slate-600 font-mono">${o.email} &bull; Pwd: ${o.password}</p>
            <p class="text-[10px] text-slate-500">${store ? store.name : o.storeId}</p>
          </div>
          <button onclick="deleteOperator('${o.operatorId}')" class="p-1 text-slate-400 hover:text-rose-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      `;
    }).join('');
  }
  if (window.lucide) lucide.createIcons();
}

function openStoreModal() { openModal('modal-store'); }
function openOperatorModal() { populateStoreDropdowns(); openModal('modal-operator'); }

function handleSaveStore(e) {
  e.preventDefault();
  const storeId = document.getElementById('input-store-id').value.trim().toUpperCase();
  const data = {
    storeId,
    name: document.getElementById('input-store-name').value.trim(),
    address: document.getElementById('input-store-address').value.trim(),
    location: document.getElementById('input-store-location').value.trim(),
    contactPhone: document.getElementById('input-store-phone').value.trim(),
    active: true
  };
  if (window.db) window.db.ref(`stores/${storeId}`).set(data);
  closeModal('modal-store');
  showToast(`Store ${storeId} saved.`, 'success');
}

function handleSaveOperator(e) {
  e.preventDefault();
  const opId = `OP_${Date.now().toString().slice(-4)}`;
  const data = {
    operatorId: opId,
    name: document.getElementById('input-op-name').value.trim(),
    storeId: document.getElementById('input-op-store').value,
    email: document.getElementById('input-op-email').value.trim().toLowerCase(),
    password: document.getElementById('input-op-password').value,
    phone: document.getElementById('input-op-phone').value.trim(),
    active: true
  };
  if (window.db) window.db.ref(`operators/${opId}`).set(data);
  closeModal('modal-operator');
  showToast(`Operator ${data.name} assigned to ${data.storeId}.`, 'success');
}

function deleteStore(id) { if (confirm(`Delete store ${id}?`) && window.db) window.db.ref(`stores/${id}`).remove(); }
function deleteOperator(id) { if (confirm(`Remove operator ${id}?`) && window.db) window.db.ref(`operators/${id}`).remove(); }

// =========================================================================
// STORE OPERATOR COUNTER: CARD LOOKUP, PHOTOS & MOBILE OTP
// =========================================================================
function operatorLookupCard() {
  const query = document.getElementById('op-card-search').value.trim().toUpperCase();
  if (!query) return showToast('Enter a Ration Card No or RFID UID', 'error');
  let found = currentCards[query] || Object.values(currentCards).find(c => c.rfidUid && c.rfidUid.toUpperCase() === query);
  if (!found) return showToast(`No Ration Card found for "${query}"`, 'error');
  operatorLoadCard(found.cardId);
}

function operatorLoadCard(cardId) {
  const card = currentCards[cardId];
  if (!card) return;
  activeOperatorCardId = cardId;
  generatedOtpCode = null;
  document.getElementById('otp-sim-banner').classList.add('hidden');
  document.getElementById('input-otp-code').value = '';
  document.getElementById('op-empty-state').classList.add('hidden');
  document.getElementById('op-card-workspace').classList.remove('hidden');

  const membersList = card.members ? Object.values(card.members) : [];
  const ricePerP = currentCommodities.rice ? currentCommodities.rice.kgPerPerson : 5;
  const ragiPerP = currentCommodities.ragi ? currentCommodities.ragi.kgPerPerson : 5;
  const riceQ = card.allocatedRiceKg ?? (membersList.length * ricePerP);
  const ragiQ = card.allocatedRagiKg ?? (membersList.length * ragiPerP);

  document.getElementById('op-card-head').innerText = card.headName;
  document.getElementById('op-card-cat').innerText = card.category || 'BPL';
  document.getElementById('op-card-id').innerText = card.cardId;
  document.getElementById('op-card-uid').innerText = card.rfidUid;
  document.getElementById('op-card-phone').innerText = card.phone;
  document.getElementById('otp-target-phone').innerText = card.phone;
  document.getElementById('op-quota-rice').innerText = `${riceQ.toFixed(1)} kg`;
  document.getElementById('op-quota-rice-calc').innerText = `${membersList.length} members x ${ricePerP} kg/person`;
  document.getElementById('op-quota-ragi').innerText = `${ragiQ.toFixed(1)} kg`;
  document.getElementById('op-quota-ragi-calc').innerText = `${membersList.length} members x ${ragiPerP} kg/person`;

  const badge = document.getElementById('op-card-status-badge');
  if (card.distributedThisMonth) {
    badge.className = 'px-3 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800';
    badge.innerText = `DISTRIBUTED (${card.lastDistributionDate})`;
  } else {
    badge.className = 'px-3 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800';
    badge.innerText = 'ELIGIBLE';
  }

  document.getElementById('op-members-gallery').innerHTML = membersList.map(m => `
    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <img src="${m.photoUrl || defaultAvatarUrl(m.name)}" alt="${m.name}" class="w-14 h-14 rounded object-cover border border-slate-300 bg-white shrink-0">
      <div class="min-w-0 flex-1">
        <p class="font-bold text-xs text-slate-900 truncate">${m.name}</p>
        <p class="text-[11px] text-slate-500">${m.relation} &bull; Age ${m.age || 30}</p>
        <span class="inline-block mt-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-mono text-[10px] font-bold">FP Slot #${m.fpId}</span>
      </div>
    </div>
  `).join('');
}

function switchVerificationMode(mode) {
  const btnFp = document.getElementById('btn-auth-fp');
  const btnOtp = document.getElementById('btn-auth-otp');
  const panelFp = document.getElementById('panel-verify-fp');
  const panelOtp = document.getElementById('panel-verify-otp');
  if (mode === 'fingerprint') {
    btnFp.className = 'py-2 text-xs font-bold rounded bg-white text-slate-900 shadow-sm';
    btnOtp.className = 'py-2 text-xs font-bold rounded text-slate-600 hover:text-slate-900';
    panelFp.classList.remove('hidden');
    panelOtp.classList.add('hidden');
  } else {
    btnOtp.className = 'py-2 text-xs font-bold rounded bg-white text-slate-900 shadow-sm';
    btnFp.className = 'py-2 text-xs font-bold rounded text-slate-600 hover:text-slate-900';
    panelOtp.classList.remove('hidden');
    panelFp.classList.add('hidden');
  }
}

function sendBeneficiaryOtp() {
  if (!activeOperatorCardId) return;
  const card = currentCards[activeOperatorCardId];
  if (card.distributedThisMonth) return showToast('Duplicate Blocked: Monthly ration already collected.', 'error');

  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  generatedOtpCode = String(100000 + (arr[0] % 900000));
  document.getElementById('otp-sim-code').innerText = generatedOtpCode;
  document.getElementById('otp-sim-banner').classList.remove('hidden');

  addSmsLogEntry({
    phone: card.phone, consumerName: card.headName, cardId: card.cardId,
    message: `e-PDS OTP: ${generatedOtpCode} for Ration Card ${card.cardId}. Valid for 5 minutes.`,
    timestamp: new Date().toLocaleTimeString(), status: 'DELIVERED (OTP)'
  });
  showToast(`6-digit OTP dispatched to ${card.phone}.`, 'success');
}

function verifyOtpAndDispense() {
  const entered = document.getElementById('input-otp-code').value.trim();
  if (!generatedOtpCode) return showToast('Click "Send 6-Digit Mobile OTP" first.', 'error');
  if (entered !== generatedOtpCode) return showToast('Invalid OTP code.', 'error');
  showToast('Mobile OTP verified. Authorizing dispenser.', 'success');
  simulateHardwareDispense(activeOperatorCardId, 'OTP');
}

// =========================================================================
// SEQUENTIAL DUAL-COMMODITY DISPENSING (RICE -> SWAP -> RAGI)
// =========================================================================
function confirmStage2Ragi() {
  if (window.db) window.db.ref('active_session/stage2Confirmed').set(true);
  if (simStage2Resolver) { simStage2Resolver(); simStage2Resolver = null; }
}

async function simulateHardwareDispense(cardId, authMethod = 'BIOMETRIC') {
  const card = currentCards[cardId];
  if (!card) return;
  if (card.distributedThisMonth) {
    showToast(`Card ${cardId} already distributed for this month.`, 'error');
    if (window.db) window.db.ref('active_session').update({ currentStep: 'ERROR', message: 'Duplicate Card: Already Collected This Cycle.' });
    return;
  }

  const members = card.members ? Object.values(card.members) : [];
  const activeMember = members[0] || { name: card.headName, fpId: 1 };
  const ricePerP = currentCommodities.rice ? currentCommodities.rice.kgPerPerson : 5;
  const ragiPerP = currentCommodities.ragi ? currentCommodities.ragi.kgPerPerson : 5;
  const targetRice = card.allocatedRiceKg ?? (members.length * ricePerP);
  const targetRagi = card.allocatedRagiKg ?? (members.length * ragiPerP);
  const ratio = currentConfig.demoMode ? (currentConfig.demoRatio || 100) : 1;

  if (window.db) {
    await window.db.ref('active_session').set({
      deviceOnline: true,
      currentStep: authMethod === 'OTP' ? 'AUTHORIZED_OTP' : 'AUTHENTICATING',
      currentCardId: card.cardId, currentCardUid: card.rfidUid, consumerName: activeMember.name,
      storeId: currentUser?.storeId || card.assignedStoreId || 'FPS_KA_BLR_042',
      operatorName: currentUser?.name || 'Store Operator',
      authorizedBy: authMethod, matchedFpId: authMethod === 'BIOMETRIC' ? activeMember.fpId : 0,
      currentCommodity: 'Rice', quotaRiceKg: targetRice, quotaRagiKg: targetRagi, quotaTargetKg: targetRice,
      currentWeightKg: 0.0, physicalGrams: 0.0, stage2Confirmed: false, gateStatus: 'CLOSED', servoAngle: 0,
      message: `${authMethod} Verified. Starting Stage 1: Rice (${targetRice} kg).`
    });
  }

  await runCommodityDispenseStage('Rice', targetRice, ratio);

  if (window.db) {
    await window.db.ref('active_session').update({
      currentStep: 'WAITING_STAGE2', currentCommodity: 'Ragi (Waiting)',
      gateStatus: 'CLOSED', servoAngle: 0, stage2Confirmed: false,
      message: 'Rice Complete. Swap bag for Ragi and click Confirm Ragi Vessel Placed or press ESP32 BOOT.'
    });
  }
  showToast('Stage 1 (Rice) Complete. Confirm Ragi vessel swap in telemetry bar.', 'info');

  await new Promise(resolve => {
    simStage2Resolver = resolve;
    setTimeout(() => { if (simStage2Resolver === resolve) { simStage2Resolver = null; resolve(); } }, 12000);
  });

  await runCommodityDispenseStage('Ragi', targetRagi, ratio);

  const txnId = `TXN_${Date.now().toString().slice(-6)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (window.db) {
    await window.db.ref('active_session').update({
      currentStep: 'COMPLETED', gateStatus: 'CLOSED', servoAngle: 0,
      message: `Rice (${targetRice}kg) & Ragi (${targetRagi}kg) dispensed. Valve closed at 0 deg.`
    });
    await window.db.ref(`transactions/${txnId}`).set({
      transactionId: txnId, cardId: card.cardId, rfidUid: card.rfidUid, consumerName: activeMember.name,
      beneficiaryPhone: card.phone, storeId: currentUser?.storeId || card.assignedStoreId || 'FPS_KA_BLR_042',
      operatorName: currentUser?.name || 'Store Operator', verificationMethod: authMethod,
      fpTemplateId: authMethod === 'BIOMETRIC' ? activeMember.fpId : 0,
      riceQuantityKg: targetRice, ragiQuantityKg: targetRagi, rationQuantityKg: targetRice + targetRagi,
      distributionTimestamp: nowStr, distributionDate: nowStr.split(' ')[0], status: 'SUCCESS', smsStatus: 'DELIVERED'
    });
    await window.db.ref(`cards/${card.cardId}`).update({
      distributedThisMonth: true, status: 'Distributed', lastDistributionDate: nowStr.split(' ')[0]
    });
  }

  addSmsLogEntry({
    phone: card.phone, consumerName: activeMember.name, cardId: card.cardId,
    message: `Dear ${activeMember.name}, ration of ${targetRice}kg Rice & ${targetRagi}kg Ragi dispensed via ${authMethod} at ${currentUser?.storeId || 'FPS_042'} on ${nowStr}.`,
    timestamp: new Date().toLocaleTimeString(), status: 'DELIVERED (RECEIPT)'
  });
  showToast(`Distribution completed. Confirmation SMS sent to ${card.phone}.`, 'success');

  setTimeout(() => {
    if (window.db) {
      window.db.ref('active_session').set({
        deviceOnline: true, currentStep: 'IDLE', currentCardId: '', currentCardUid: '',
        consumerName: '', authorizedBy: '', matchedFpId: 0, currentCommodity: '',
        quotaTargetKg: 0, currentWeightKg: 0, physicalGrams: 0, gateStatus: 'CLOSED', servoAngle: 0,
        message: 'System Ready. Waiting for RFID Card or Store Operator Verification.'
      });
    }
  }, 4500);
}

function runCommodityDispenseStage(commodityName, targetKg, ratio) {
  return new Promise(resolve => {
    let curKg = 0;
    if (window.db) {
      window.db.ref('active_session').update({
        currentStep: 'DISPENSING', currentCommodity: commodityName, quotaTargetKg: targetKg,
        currentWeightKg: 0, physicalGrams: 0, gateStatus: 'OPEN', servoAngle: 60,
        message: `Servo OPEN 60 deg: Dispensing ${commodityName} (Target: ${targetKg} kg).`
      });
    }
    const timer = setInterval(() => {
      curKg += Math.max(0.5, targetKg / 6);
      if (curKg >= targetKg) {
        curKg = targetKg;
        clearInterval(timer);
        if (window.db) {
          window.db.ref('active_session').update({
            currentWeightKg: targetKg, physicalGrams: parseFloat((targetKg * 1000 / ratio).toFixed(1)),
            gateStatus: 'CLOSED', servoAngle: 0
          });
        }
        resolve();
      } else if (window.db) {
        window.db.ref('active_session').update({
          currentWeightKg: parseFloat(curKg.toFixed(2)),
          physicalGrams: parseFloat((curKg * 1000 / ratio).toFixed(1))
        });
      }
    }, 450);
  });
}

// =========================================================================
// TRANSACTIONS, RECEIPTS, SMS & SETTINGS
// =========================================================================
function renderTransactions() {
  const tbody = document.getElementById('transactions-tbody');
  if (!tbody) return;
  const txns = Object.values(currentTransactions).sort((a, b) => new Date(b.distributionTimestamp || 0) - new Date(a.distributionTimestamp || 0));
  if (txns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-400">No distribution transactions recorded.</td></tr>`;
    return;
  }
  tbody.innerHTML = txns.map(t => {
    const r = t.riceQuantityKg ?? t.rationQuantityKg ?? 0;
    const g = t.ragiQuantityKg ?? 0;
    const method = t.verificationMethod || 'BIOMETRIC';
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono font-bold text-slate-900">${t.transactionId}</td>
        <td class="p-3 font-mono text-slate-700">${t.cardId} <span class="text-[10px] text-slate-500 block">${t.storeId || 'FPS_042'}</span></td>
        <td class="p-3 font-semibold text-slate-800">${t.consumerName}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-800">${method}${t.fpTemplateId ? ` #${t.fpTemplateId}` : ''}</span></td>
        <td class="p-3 font-bold text-slate-900">${r}kg Rice + ${g}kg Ragi</td>
        <td class="p-3 text-slate-600 font-mono">${t.distributionTimestamp}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">${t.status}</span></td>
        <td class="p-3 text-right">
          <button onclick="printReceipt('${t.transactionId}')" class="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded"><i data-lucide="printer" class="w-4 h-4"></i></button>
        </td>
      </tr>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function exportTransactionsCSV() {
  const txns = Object.values(currentTransactions);
  if (txns.length === 0) return showToast('No transactions to export.', 'info');
  let csv = 'Transaction ID,Card ID,Store ID,Consumer Name,Method,Rice (kg),Ragi (kg),Total (kg),Timestamp,Status\n';
  txns.forEach(t => {
    const r = t.riceQuantityKg ?? t.rationQuantityKg ?? 0;
    const g = t.ragiQuantityKg ?? 0;
    csv += `"${t.transactionId}","${t.cardId}","${t.storeId || ''}","${t.consumerName}","${t.verificationMethod || 'BIOMETRIC'}","${r}","${g}","${r + g}","${t.distributionTimestamp}","${t.status}"\n`;
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = `pds_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

function printReceipt(txnId) {
  const t = currentTransactions[txnId];
  if (!t) return;
  const r = t.riceQuantityKg ?? t.rationQuantityKg ?? 0;
  const g = t.ragiQuantityKg ?? 0;
  const w = window.open('', '_blank', 'width=450,height=600');
  w.document.write(`
    <html><head><title>Official e-PDS Receipt ${txnId}</title>
    <style>body{font-family:monospace;padding:20px;font-size:13px}.center{text-align:center}.line{border-bottom:1px dashed #000;margin:10px 0}.row{display:flex;justify-content:space-between;margin:4px 0}.bold{font-weight:bold}</style>
    </head><body>
      <div class="center"><h3 style="margin:0;">DEPT. OF FOOD & CIVIL SUPPLIES</h3><p>e-PDS Official Receipt | Store: ${t.storeId || 'FPS_KA_BLR_042'}</p></div>
      <div class="line"></div>
      <div class="row"><span>Txn ID:</span><span class="bold">${t.transactionId}</span></div>
      <div class="row"><span>Date:</span><span>${t.distributionTimestamp}</span></div>
      <div class="row"><span>Card ID:</span><span class="bold">${t.cardId}</span></div>
      <div class="row"><span>Beneficiary:</span><span class="bold">${t.consumerName}</span></div>
      <div class="row"><span>Auth Method:</span><span>${t.verificationMethod || 'BIOMETRIC'}</span></div>
      <div class="line"></div>
      <div class="row"><span class="bold">RICE DISPENSED:</span><span class="bold">${r} KG</span></div>
      <div class="row"><span class="bold">RAGI DISPENSED:</span><span class="bold">${g} KG</span></div>
      <div class="row"><span class="bold">TOTAL WEIGHT:</span><span class="bold">${r + g} KG</span></div>
      <div class="line"></div>
      <div class="center"><p>Biometric / OTP Verified Transaction &bull; SMS Delivered</p></div>
    </body></html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 250);
}

let smsLogs = [
  { phone: '+919876543210', consumerName: 'Ramesh Kumar', cardId: 'RC101', message: 'e-PDS Notice: Monthly Rice (5kg/p) & Ragi (5kg/p) distribution commenced at Fair Price Shop #42.', timestamp: '09:00 AM', status: 'DELIVERED' }
];

function openBroadcastModal() {
  document.getElementById('confirm-recipient-count').innerText = Object.keys(currentCards).length;
  document.getElementById('confirm-broadcast-preview').innerText = document.getElementById('broadcast-msg-text').value;
  openModal('modal-broadcast');
}

function executeBroadcastSMS() {
  const message = document.getElementById('broadcast-msg-text').value;
  const cards = Object.values(currentCards);
  if (window.db) {
    window.db.ref('broadcast_notification').set({ lastTriggered: new Date().toLocaleString(), message, status: 'ACTIVE_BROADCAST', totalSent: cards.length, lastSender: currentUser.id });
  }
  cards.forEach((c, idx) => {
    setTimeout(() => addSmsLogEntry({ phone: c.phone, consumerName: c.headName, cardId: c.cardId, message, timestamp: new Date().toLocaleTimeString(), status: 'DELIVERED (BROADCAST)' }), idx * 150);
  });
  closeModal('modal-broadcast');
  showToast(`Broadcast SMS dispatched to ${cards.length} registered families.`, 'success');
}

function addSmsLogEntry(entry) { smsLogs.unshift(entry); renderSmsLogs(); }

function renderSmsLogs() {
  const c = document.getElementById('sms-logs-container');
  if (!c) return;
  c.innerHTML = smsLogs.map(l => `
    <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-start">
      <div class="space-y-1">
        <div class="flex items-center gap-2"><span class="font-bold text-slate-900">${l.consumerName}</span><span class="font-mono text-slate-500">(${l.phone})</span><span class="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">${l.cardId}</span></div>
        <p class="text-slate-600 font-mono text-[11px]">${l.message}</p>
      </div>
      <div class="text-right whitespace-nowrap pl-2">
        <span class="text-emerald-700 font-bold text-[11px]">${l.status}</span>
        <span class="text-[10px] text-slate-400 block">${l.timestamp}</span>
      </div>
    </div>
  `).join('');
}

function triggerQuickCalibrate500g() {
  if (window.db) window.db.ref('system_config/quickCalibrateCmd').set(true).then(() => showToast('500g bottle auto-calibration queued for ESP32.', 'success'));
}

function saveHardwareSettings() {
  const data = {
    demoMode: document.getElementById('setting-demo-mode').checked,
    demoRatio: parseInt(document.getElementById('setting-demo-ratio').value, 10) || 100,
    calibrationFactor: parseFloat(document.getElementById('setting-calib-factor').value) || 420.5,
    servoClosedAngle: parseInt(document.getElementById('setting-servo-closed').value, 10) || 0,
    servoOpenAngle: parseInt(document.getElementById('setting-servo-open').value, 10) || 60
  };
  if (window.db) window.db.ref('system_config').update(data).then(() => showToast('Hardware settings synced to ESP32.', 'success'));
}

function captureLiveRfid() {
  if (currentActiveSession && currentActiveSession.currentCardUid) {
    document.getElementById('input-rfid-uid').value = currentActiveSession.currentCardUid;
    showToast(`Captured UID: ${currentActiveSession.currentCardUid}`, 'success');
  } else { showToast('Tap an RFID card on the ESP32 reader first.', 'info'); }
}

function triggerRemoteFingerprintEnroll(btn) {
  const row = btn.closest('.member-row');
  const fpInput = row.querySelector('.member-fpid');
  const nameInput = row.querySelector('.member-name');
  const fpId = parseInt(fpInput.value, 10);
  const memberName = (nameInput?.value || 'Member').trim();

  if (!fpId || fpId < 1 || fpId > 127) {
    showToast('Enter a valid FP# slot between 1 and 127 first.', 'error');
    fpInput.focus();
    return;
  }

  if (!window.db) {
    showToast(`Demo mode: Enter FP# ${fpId} manually or connect Firebase + ESP32 R307 for live enrollment.`, 'info');
    return;
  }

  const cmdRef = window.db.ref('system_config/enrollCmd');
  btn.disabled = true;
  btn.innerText = 'Scanning...';
  btn.className = 'enroll-fp-btn px-2 py-1 text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 rounded whitespace-nowrap';

  cmdRef.set({
    fpId,
    memberName,
    status: 'PENDING',
    message: `Place finger for ${memberName} (Slot #${fpId}) on R307 sensor...`,
    requestedAt: Date.now()
  }).then(() => {
    showToast(`Enrollment requested for Slot #${fpId}. Place finger on R307 sensor...`, 'info');
    let settled = false;
    const resetBtn = (label, cls) => {
      btn.disabled = false;
      btn.innerText = label;
      btn.className = cls;
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cmdRef.off('value', listener);
      resetBtn('Enroll', 'enroll-fp-btn px-2 py-1 text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap');
      showToast('Enrollment timed out. Check ESP32 Wi-Fi and R307 wiring.', 'error');
    }, 35000);

    const listener = cmdRef.on('value', (snap) => {
      const val = snap.val();
      if (!val || settled) return;
      if (val.status === 'SUCCESS') {
        settled = true;
        clearTimeout(timer);
        cmdRef.off('value', listener);
        resetBtn('Enrolled', 'enroll-fp-btn px-2 py-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded whitespace-nowrap');
        showToast(val.message || `Fingerprint enrolled in Slot #${fpId}!`, 'success');
      } else if (val.status === 'ERROR') {
        settled = true;
        clearTimeout(timer);
        cmdRef.off('value', listener);
        resetBtn('Retry', 'enroll-fp-btn px-2 py-1 text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 rounded whitespace-nowrap');
        showToast(val.message || 'Fingerprint enrollment failed.', 'error');
      }
    });
  }).catch((err) => {
    btn.disabled = false;
    btn.innerText = 'Enroll';
    showToast('Firebase error: ' + err.message, 'error');
  });
}

function switchPortal(portal) {
  const adminView = document.getElementById('admin-view');
  const opView = document.getElementById('operator-view');
  const telemetry = document.getElementById('shared-telemetry-panel');
  const btnAdmin = document.getElementById('btn-tab-admin');
  const btnOp = document.getElementById('btn-tab-operator');

  [adminView, opView].forEach(v => v?.classList.add('hidden'));
  if (btnAdmin) btnAdmin.className = 'px-2.5 py-1 rounded text-slate-200 hover:text-white transition';
  if (btnOp) btnOp.className = 'px-2.5 py-1 rounded text-slate-200 hover:text-white transition';

  if (portal === 'admin' && currentUser?.role === 'admin') {
    adminView.classList.remove('hidden');
    telemetry.classList.remove('hidden');
    if (btnAdmin) btnAdmin.className = 'px-2.5 py-1 rounded bg-white text-slate-900 transition';
  } else if (portal === 'operator' && (currentUser?.role === 'operator' || currentUser?.role === 'admin')) {
    opView.classList.remove('hidden');
    telemetry.classList.remove('hidden');
    if (btnOp) btnOp.className = 'px-2.5 py-1 rounded bg-white text-slate-900 transition';
    updateOperatorStoreBanner();
  }
}

function updateOperatorStoreBanner() {
  const sId = currentUser?.storeId || 'FPS_KA_BLR_042';
  const store = currentStores[sId] || DEFAULT_SEED_DATA.stores[sId] || DEFAULT_SEED_DATA.stores['FPS_KA_BLR_042'];
  document.getElementById('op-store-name').innerText = store.name;
  document.getElementById('op-store-id').innerText = store.storeId;
  document.getElementById('op-store-address').innerText = store.address;
  document.getElementById('op-store-gps').innerText = store.location || '--';
  document.getElementById('op-user-name').innerText = currentUser?.name || 'Store Operator';
}

function switchAdminTab(tab) {
  activeAdminTab = tab;
  ['beneficiaries', 'stores', 'commodities', 'transactions', 'sms', 'settings'].forEach(t => {
    const sec = document.getElementById(`section-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (t === tab) {
      if (sec) sec.classList.remove('hidden');
      if (btn) btn.className = 'border-b-2 border-blue-900 py-3 px-1 text-sm font-semibold text-blue-900 flex items-center gap-1.5';
    } else {
      if (sec) sec.classList.add('hidden');
      if (btn) btn.className = 'border-b-2 border-transparent py-3 px-1 text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5';
    }
  });
}

function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-700 text-white' : type === 'error' ? 'bg-rose-700 text-white' : 'bg-slate-900 text-white';
  toast.className = `${bg} px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg pointer-events-auto`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
