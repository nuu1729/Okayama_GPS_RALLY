// ===== Service Worker registration =====
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(reg => console.log("Service Worker registered:", reg))
    .catch(err => console.error("SW registration failed:", err));
}

// --- 翻訳（日本語メイン、他言語は省略表示） ---
const translations = {
  ja: {
    appTitle: "🏯 岡山GPSスタンプラリー",
    stampLabel: "集めたスタンプ",
    calculating: "距離を計算中…",
    getStamp: "スタンプゲット！",
    acquired: "✓ ゲット済み",
    approachMore: "あと{distance}m近づいてね",
    stampAcquired: "🎉 {name}のスタンプをゲット！",
    locationError: "位置情報を読み込み中…ちょっと待ってね",
    needApproach: "あと{distance}m近づいてね",
    footerText: "位置情報をオンにして、チェックポイントに行こう！",
    allComplete: "🎊 全部集めたよ！おめでとう！",
    distance: "現在地からの距離: {distance}",
    permissionDenied: "位置情報がオフになってるみたい。設定でオンにしてね",
    positionUnavailable: "いま位置がわからないよ",
    timeout: "位置情報の取得が時間切れだよ",
    generalError: "位置情報の取得中にエラーが起きたよ",
    tabRally: "🎯 ラリー",
    tabCollection: "📚 コレクション",
    notAcquired: "まだゲットしてないよ"
  },
  en: {
    appTitle: "🏯 Okayama GPS Stamp Rally",
    stampLabel: "Your Stamps",
    calculating: "Checking distance…",
    getStamp: "Get Stamp!",
    acquired: "✓ Got it",
    approachMore: "Move {distance}m closer",
    stampAcquired: "🎉 You got {name} stamp!",
    locationError: "Loading location… please wait",
    needApproach: "Move {distance}m closer",
    footerText: "Turn on location and head to the spots!",
    allComplete: "🎊 Congrats! You got all the stamps!",
    distance: "Distance: {distance}",
    permissionDenied: "Location is off. Please turn it on in settings.",
    positionUnavailable: "Can't find your location",
    timeout: "Location check took too long",
    generalError: "Something went wrong with location",
    tabRally: "🎯 Rally",
    tabCollection: "📚 Collection",
    notAcquired: "Not collected yet"
  },
  ko: {
    appTitle: "🏯 오카야마 GPS 스탬프 랠리",
    stampLabel: "모은 스탬프",
    calculating: "거리 계산 중…",
    getStamp: "스탬프 받기!",
    acquired: "✓ 획득함",
    approachMore: "{distance}m 더 가까이 와주세요",
    stampAcquired: "🎉 {name} 스탬프 획득!",
    locationError: "위치 확인 중… 잠시만요",
    needApproach: "{distance}m 더 가까이 가세요",
    footerText: "위치 서비스를 켜고 포인트로 가보세요!",
    allComplete: "🎊 전부 모았어요! 축하합니다!",
    distance: "현재 위치에서: {distance}",
    permissionDenied: "위치 서비스가 꺼져 있어요. 설정에서 켜주세요",
    positionUnavailable: "위치를 찾을 수 없어요",
    timeout: "위치 확인이 너무 오래 걸려요",
    generalError: "위치 확인 중 오류가 났어요",
    tabRally: "🎯 랠리",
    tabCollection: "📚 모음집",
    notAcquired: "아직 안 모았어요"
  },
  zh: {
    appTitle: "🏯 冈山GPS集章活动",
    stampLabel: "我的印章",
    calculating: "正在计算距离…",
    getStamp: "获取印章！",
    acquired: "✓ 已获取",
    approachMore: "再靠近{distance}米",
    stampAcquired: "🎉 你拿到{name}印章啦！",
    locationError: "正在获取位置，请稍等",
    needApproach: "再靠近{distance}米",
    footerText: "打开定位，去指定点看看吧！",
    allComplete: "🎊 恭喜！你收集齐了所有印章！",
    distance: "距离当前位置: {distance}",
    permissionDenied: "定位被关闭了，请在设置里开启",
    positionUnavailable: "现在找不到你的位置",
    timeout: "定位超时啦",
    generalError: "获取位置时出了点问题",
    tabRally: "🎯 活动",
    tabCollection: "📚 收藏",
    notAcquired: "还没拿到"
  }
};

// グローバル変数
let visitedLocations = new Set();
let currentPosition = null;
let watchId = null;
let currentLanguage = 'ja';
let currentTab = 'rally';
let locations = []; // バックエンドから取得するデータを格納

// 地図関連の変数
let map = null;
let markers = [];
let userMarker = null;

// ===== ユーザー同期機能追加（修正版） =====
class UserSyncManager {
  constructor() {
    this.userId = null;
    this.syncInterval = null;
    this.API_BASE = this.detectApiBase();
    this.isOnline = navigator.onLine;
    this.pendingSync = false;
  }

  // API Base URLを自動検出
  detectApiBase() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // ローカル開発環境の場合
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000/api`;
    }
    
    // 本番環境の場合（同一オリジン）
    return `${protocol}//${hostname}/api`;
  }

  async initUser() {
    try {
      const savedUserId = localStorage.getItem('stampRallyUserId');
      if (savedUserId) {
        this.userId = savedUserId;
        console.log('✅ Existing user loaded:', this.userId.substring(0, 8) + '...');
        return await this.syncFromServer();
      }

      const deviceInfo = this.getDeviceInfo();
      const language = currentLanguage || 'ja';
      
      console.log('🔄 Creating new user...');
      
      const response = await fetch(`${this.API_BASE}/users/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceInfo, language })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.userId) {
        this.userId = result.userId;
        localStorage.setItem('stampRallyUserId', this.userId);
        console.log('✅ New user created:', this.userId.substring(0, 8) + '...');
        this.showSyncStatus('success', '新しいユーザーを作成しました');
        return true;
      } else {
        throw new Error(result.error || 'ユーザー作成に失敗しました');
      }
    } catch (error) {
      console.warn('❌ User init failed:', error);
      this.showSyncStatus('error', 'オフラインモードで動作中');
      this.isOnline = false;
      return false;
    }
  }

  getDeviceInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone Safari';
    if (ua.includes('Android')) return 'Android Chrome';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac PC';
    return 'Unknown Device';
  }

  async syncFromServer() {
    if (!this.userId || !this.isOnline) return false;
    
    try {
      console.log('🔄 Syncing from server...');
      
      const response = await fetch(`${this.API_BASE}/users/${this.userId}/data`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ User not found on server, will recreate');
          // ユーザーIDを削除して再作成を促す
          localStorage.removeItem('stampRallyUserId');
          this.userId = null;
          return await this.initUser();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const serverData = result.data;
        const localVisited = new Set(visitedLocations);
        const serverVisited = new Set(serverData.visitedLocations);
        
        // サーバーにあってローカルにないデータを同期
        let hasUpdates = false;
        serverVisited.forEach(stampId => {
          if (!localVisited.has(stampId)) {
            visitedLocations.add(stampId);
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          saveData();
          updateDisplay();
          if (currentTab === 'collection') {
            updateCollectionDisplay();
          }
          console.log(`✅ Synced ${hasUpdates ? 'new ' : ''}data from server`);
          this.showSyncStatus('success', `${hasUpdates ? '新しい' : ''}データを同期しました`);
        }
        
        return true;
      } else {
        throw new Error(result.error || 'サーバーからのデータ取得に失敗');
      }
    } catch (error) {
      console.warn('❌ Sync from server failed:', error);
      this.showSyncStatus('error', '同期に失敗しました');
      this.isOnline = false;
      return false;
    }
  }

  async recordStampToServer(stampId, location) {
    if (!this.userId || !this.isOnline) {
      this.pendingSync = true;
      console.log('📦 Stamp queued for later sync:', stampId);
      return false;
    }
    
    try {
      console.log('🔄 Recording stamp to server:', stampId);
      
      const response = await fetch(`${this.API_BASE}/users/${this.userId}/stamps/${stampId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          location: {
            lat: location.lat,
            lng: location.lng
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Stamp recorded to server:', stampId);
        this.showSyncStatus('success', 'スタンプをサーバーに保存しました');
        return true;
      } else if (result.message === "Stamp already collected") {
        console.log('ℹ️ Stamp already exists on server:', stampId);
        return false;
      } else {
        throw new Error(result.error || 'スタンプの保存に失敗');
      }
    } catch (error) {
      console.warn('❌ Failed to record stamp to server:', error);
      this.pendingSync = true;
      this.showSyncStatus('error', 'スタンプ保存に失敗（後で再試行）');
      return false;
    }
  }

  showSyncStatus(type, message) {
    const statusElement = document.getElementById('syncStatus');
    const connectionIndicator = document.getElementById('connectionIndicator');
    const connectionText = document.querySelector('.connection-text');
    
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `sync-status ${type}`;
      statusElement.style.display = 'block';
      
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    }

    // 接続状態インジケーターの更新
    if (connectionIndicator && connectionText) {
      if (this.isOnline) {
        connectionIndicator.textContent = '🟢';
        connectionText.textContent = 'オンライン';
      } else {
        connectionIndicator.textContent = '🔴';
        connectionText.textContent = 'オフライン';
      }
    }
  }

  startAutoSync() {
    this.stopAutoSync();
    this.syncInterval = setInterval(async () => {
      if (this.isOnline && this.pendingSync) {
        await this.syncPendingData();
      }
      await this.syncFromServer();
    }, 30000); // 30秒間隔
  }

  async syncPendingData() {
    // ローカルの未同期データをサーバーに送信
    const localData = JSON.parse(localStorage.getItem('stampRallyData') || '{}');
    if (localData.visitedLocations) {
      for (const stampId of localData.visitedLocations) {
        await this.recordStampToServer(stampId, { lat: 0, lng: 0 });
      }
      this.pendingSync = false;
    }
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // オンライン/オフライン状態監視
  initNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showSyncStatus('success', 'オンラインに戻りました');
      this.syncFromServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showSyncStatus('warning', 'オフラインモードです');
    });
  }
}

// グローバルインスタンス
const userSyncManager = new UserSyncManager();

// ===== バックエンドからスタンプデータを取得（修正版） =====
async function fetchStamps() {
  try {
    console.log('🔄 Fetching stamps from backend...');
    
    const res = await fetch(`${userSyncManager.API_BASE.replace('/api', '')}/api/stamps`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const stamps = await res.json();
    console.log("✅ Stamps data loaded from backend:", stamps.length);

    // バックエンドから取得したデータをlocationsに設定
    locations = stamps;
    
    // データ取得後にアプリを初期化
    initStampRally();
  } catch (err) {
    console.warn("⚠️ Backend unavailable, using fallback data:", err);
    
    // フォールバック: 静的データを使用
    locations = [
      { 
        id: 0,
        name: {
          ja: "西古松南部公園", 
          en: "Nishikomatsu Nanbu Park",
          ko: "니시코마츠 남부공원",
          zh: "西古松南部公园"
        },
        address: "〒700-0973 岡山県岡山市北区下中野",
        lat: 34.6433, lng: 133.9053, radius: 100,
        image: "images/location-0.jpg",
        icon: "🌳"
      },
      { 
        id: 1,
        name: {
          ja: "大元東公園", 
          en: "Omoto East Park",
          ko: "오모토 동쪽공원",
          zh: "大元东公园"
        },
        address: "〒700-0927 岡山県岡山市北区西古松250",
        lat: 34.6427, lng: 133.9089, radius: 100,
        image: "images/location-1.png",
        icon: "🌸"
      },
      {
        id: 2,
        name: {
          ja: "岡山城",
          en: "Okayama Castle",
          ko: "오카야마성",
          zh: "冈山城"
        },
        address: "〒700-0823 岡山県岡山市北区丸の内2-3-1",
        lat: 34.664788, lng: 133.935969, radius: 10000,
        image: "images/location-2.jpg",
        icon: "🏯"
      },
      {
        id: 3,
        name: {
          ja: "岡山後楽園",
          en: "Okayama Korakuen",
          ko: "오카야마 고라쿠엔",
          zh: "冈山后乐园"
        },
        address: "〒703-8257 岡山県岡山市北区後楽園1-5",
        lat: 34.667697, lng: 133.936505, radius: 10000,
        image: "images/location-3.jpg",
        icon: "🌺"
      }
    ];

    // オフラインモードでも動作するように
    userSyncManager.isOnline = false;
    userSyncManager.showSyncStatus('warning', 'オフラインモードで動作中');
    
    console.log("✅ Using fallback data with", locations.length, "locations");
    initStampRally();
  }
}

// スタンプラリーの初期化（データ取得後に実行）
function initStampRally() {
  console.log('スタンプラリー初期化開始 - locations数:', locations.length);
  
  // 総スタンプ数を更新
  const totalStampsElement = document.getElementById('totalStamps');
  if (totalStampsElement) {
    totalStampsElement.textContent = locations.length;
  }
  
  // 地図を初期化（少し遅延させる）
  setTimeout(() => {
    initMap();
  }, 100);
  
  // HTMLの更新（動的にlocation cardsを生成）
  updateLocationCards();
  
  // その他の初期化処理
  loadSavedData();
  updateDisplay();
  updateLanguage();
  generateCollectionGrid();
  
  console.log('スタンプラリー初期化完了');
}

// 地図初期化関数
function initMap() {
  // 地図要素が存在するかチェック
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.warn('地図要素が見つかりません');
    return;
  }

  try {
    // 初期表示位置（岡山駅あたり）
    map = L.map('map').setView([34.6653, 133.9171], 13);

    // タイル（地図画像）
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 各ロケーションにピンを立てる
    markers = []; // 既存のマーカーをクリア
    locations.forEach((loc, i) => {
      const marker = L.marker([loc.lat, loc.lng]).addTo(map)
        .bindPopup(`<b>${loc.name.ja}</b><br>${loc.address}`);
      markers.push(marker);
    });

    console.log('地図が正常に初期化されました - マーカー数:', markers.length);
  } catch (error) {
    console.error('地図初期化エラー:', error);
  }
}

// location cardsを動的に生成する関数
function updateLocationCards() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  // 既存のlocation cardsをクリア
  mainContent.innerHTML = '';

  // 各locationに対してcardを生成
  locations.forEach((loc, index) => {
    const article = document.createElement('article');
    article.className = 'location-card';
    article.id = `location-${index}`;
    article.setAttribute('aria-labelledby', `locname-${index}`);
    
    article.innerHTML = `
      <div class="location-header">
        <span class="stamp-icon" aria-hidden="true">${loc.icon}</span>
        <div class="location-info">
          <div id="locname-${index}" class="location-name">${loc.name.ja}</div>
          <div class="location-address">${loc.address}</div>
        </div>
      </div>
      <div id="distance-${index}" class="distance-info">距離を計算中...</div>
      <button class="check-button" id="checkBtn-${index}" onclick="checkLocation(${index})">スタンプを獲得する</button>
    `;
    
    mainContent.appendChild(article);
  });
}

// DOMContentLoaded イベントリスナー（統合版）
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM読み込み完了');
  
  // ネットワーク監視開始
  userSyncManager.initNetworkMonitoring();
  
  // ユーザー初期化
  await userSyncManager.initUser();
  userSyncManager.startAutoSync();
  
  // バックエンドからデータを取得してからアプリを初期化
  fetchStamps();
  
  // BGMとUI関連の初期化は先に行う
  tryAutoPlayBGM();
  bindUI();
  startLocationTracking();
  updateLanguage();
});

function bindUI() {
  const playBtn = document.getElementById('playBGM'); 
  if (playBtn) playBtn.addEventListener('click', () => {
    const bgm = document.getElementById('bgm'); 
    if (bgm) bgm.play().catch(() => {});
  });
  
  const stopBtn = document.getElementById('stopBGM'); 
  if (stopBtn) stopBtn.addEventListener('click', () => {
    const bgm = document.getElementById('bgm'); 
    if (bgm) { bgm.pause(); bgm.currentTime = 0; }
  });
  
  // ダークモード切替（セレクト形式）
  const themeSelect = document.getElementById('themeBtn');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      if (themeSelect.value === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    });
  }
}

// ===== Tab switching =====
function switchTab(tabName) {
  // タブの切り替え
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  
  // コンテンツの切り替え
  document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
  document.getElementById(`${tabName}-content`).classList.add('active');
  
  currentTab = tabName;
  
  if (tabName === 'collection') {
    updateCollectionDisplay();
  }
}

// ===== Collection Grid =====
function generateCollectionGrid() {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  locations.forEach((location, index) => {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.id = `collection-${index}`;
    
    const isAcquired = visitedLocations.has(index);
    if (!isAcquired) {
      card.classList.add('locked');
    }
    
    card.innerHTML = `
      <div class="collection-image-container">
        ${isAcquired ? 
          `<img class="collection-image" src="${location.image}" alt="${location.name.ja}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div class="collection-placeholder" style="display:none;">${location.icon}</div>` :
          `<div class="collection-placeholder">${location.icon}</div>`
        }
      </div>
      <div class="collection-info">
        <div class="collection-title">${isAcquired ? location.name[currentLanguage] || location.name.ja : '???'}</div>
        <div class="collection-address">${isAcquired ? location.address : '???'}</div>
      </div>
      <div class="collection-status ${isAcquired ? 'acquired' : 'locked'}">
        ${isAcquired ? getText('acquired') : getText('notAcquired')}
      </div>
    `;
    
    grid.appendChild(card);
  });
}

function updateCollectionDisplay() {
  locations.forEach((location, index) => {
    const card = document.getElementById(`collection-${index}`);
    if (!card) return;
    
    const isAcquired = visitedLocations.has(index);
    const imageContainer = card.querySelector('.collection-image-container');
    const title = card.querySelector('.collection-title');
    const address = card.querySelector('.collection-address');
    const status = card.querySelector('.collection-status');
    
    if (isAcquired) {
      card.classList.remove('locked');
      
      // 画像を表示
      imageContainer.innerHTML = `
        <img class="collection-image" src="${location.image}" alt="${location.name.ja}" 
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="collection-placeholder" style="display:none;">${location.icon}</div>
      `;
      
      // 情報を表示
      title.textContent = location.name[currentLanguage] || location.name.ja;
      address.textContent = location.address;
      status.textContent = getText('acquired');
      status.className = 'collection-status acquired';
    } else {
      card.classList.add('locked');
      
      // プレースホルダーを表示
      imageContainer.innerHTML = `<div class="collection-placeholder">${location.icon}</div>`;
      
      // 情報を隠す
      title.textContent = '???';
      address.textContent = '???';
      status.textContent = getText('notAcquired');
      status.className = 'collection-status locked';
    }
  });
}

// ===== language =====
function changeLanguage() { 
  const select = document.getElementById('languageSelect'); 
  currentLanguage = select.value; 
  updateLanguage(); 
  saveLanguage(); 
  if (currentTab === 'collection') {
    updateCollectionDisplay();
  }
}

function updateLanguage() { 
  updateDistances(); 
  
  const appTitle = document.getElementById('appTitle'); 
  if (appTitle) appTitle.textContent = translations[currentLanguage].appTitle;
  
  const footer = document.getElementById('footerText'); 
  if (footer) footer.textContent = translations[currentLanguage].footerText;
  
  const stampLabel = document.getElementById('stampLabel');
  if (stampLabel) stampLabel.textContent = translations[currentLanguage].stampLabel;
  
  // タブのテキストを更新
  const tabRally = document.getElementById('tab-rally');
  if (tabRally) tabRally.textContent = translations[currentLanguage].tabRally;
  
  const tabCollection = document.getElementById('tab-collection');
  if (tabCollection) tabCollection.textContent = translations[currentLanguage].tabCollection;

  // location cardsの名前を更新
  locations.forEach((loc, i) => {
    const nameElement = document.getElementById(`locname-${i}`);
    if (nameElement) {
      nameElement.textContent = loc.name[currentLanguage] || loc.name.ja;
    }
  });
}

function getText(key, params = {}) { 
  let txt = (translations[currentLanguage] && translations[currentLanguage][key]) || translations.ja[key] || ''; 
  Object.keys(params).forEach(k => { 
    txt = txt.replace(`{${k}}`, params[k]); 
  }); 
  return txt; 
}

// ===== Geolocation =====
function startLocationTracking() { 
  if (!navigator.geolocation) { 
    showStatus(getText('generalError'), 'error'); 
    return; 
  } 
  
  const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }; 
  watchId = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, opts); 
  showStatus(getText('locationError'), 'info'); 
}

function onLocationSuccess(pos) { 
  currentPosition = { 
    lat: pos.coords.latitude, 
    lng: pos.coords.longitude, 
    accuracy: pos.coords.accuracy 
  }; 
  updateDistances(); 
  
  if (pos.coords.accuracy < 100) {
    clearStatus(); 
  } else {
    showStatus(getText('locationError'), 'info'); 
  }

  // 現在地マーカーを更新
  if (map && currentPosition) {
    if (!userMarker) {
      // 現在地マーカーを作成
      userMarker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map).bindPopup("現在地");
    } else {
      // 既存のマーカーの位置を更新
      userMarker.setLatLng([currentPosition.lat, currentPosition.lng]);
    }
  }
}

function onLocationError(err) { 
  let message = '';
  switch(err.code) { 
    case err.PERMISSION_DENIED: 
      message = getText('permissionDenied'); 
      break; 
    case err.POSITION_UNAVAILABLE: 
      message = getText('positionUnavailable'); 
      break; 
    case err.TIMEOUT: 
      message = getText('timeout'); 
      break; 
    default: 
      message = getText('generalError'); 
      break; 
  } 
  showStatus(message, 'error'); 
}

function calculateDistance(lat1, lng1, lat2, lng2) { 
  const R = 6371000; 
  const dLat = toRadians(lat2 - lat1); 
  const dLng = toRadians(lng2 - lng1); 
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
           Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
           Math.sin(dLng / 2) * Math.sin(dLng / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

function toRadians(degrees) { 
  return degrees * (Math.PI / 180); 
}

function formatDistance(distance) { 
  return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`; 
}

function updateDistances() { 
  if (!currentPosition || locations.length === 0) return; 
  
  locations.forEach((loc, i) => { 
    const dist = calculateDistance(
      currentPosition.lat, 
      currentPosition.lng, 
      loc.lat, 
      loc.lng
    ); 
    
    const distanceElement = document.getElementById(`distance-${i}`); 
    if (distanceElement) {
      distanceElement.textContent = getText('distance', { distance: formatDistance(dist) }); 
    }
    
    const btn = document.getElementById(`checkBtn-${i}`); 
    if (!btn) return; 
    
    if (visitedLocations.has(i)) { 
      btn.textContent = getText('acquired'); 
      btn.disabled = true; 
      btn.classList.remove('pulse'); 
    } else if (dist <= loc.radius) { 
      btn.textContent = getText('getStamp'); 
      btn.disabled = false; 
      btn.classList.add('pulse'); 
    } else { 
      const need = Math.max(0, Math.round(dist - loc.radius)); 
      btn.textContent = getText('approachMore', { distance: need }); 
      btn.disabled = true; 
      btn.classList.remove('pulse'); 
    } 
  }); 
}

// ===== Stamp check =====
async function checkLocation(index) {
  if (!currentPosition) {
    showStatus(getText('locationError'), 'info');
    return;
  }

  const loc = locations[index];
  const dist = calculateDistance(
    currentPosition.lat,
    currentPosition.lng,
    loc.lat,
    loc.lng
  );

  if (dist <= loc.radius) {
    if (!visitedLocations.has(index)) {
      visitedLocations.add(index);
      saveData();
      updateDisplay();

      const card = document.getElementById(`location-${index}`);
      if (card) {
        card.classList.add('visited');
      }

      // サーバーに記録
      await userSyncManager.recordStampToServer(index, {
        lat: currentPosition.lat,
        lng: currentPosition.lng
      });

      // 効果音
      playStampSound();

      // ステータス表示
      showStatus(
        getText('stampAcquired', { name: loc.name[currentLanguage] || loc.name.ja }),
        'success'
      );

      // コレクション画面が開いている場合は更新
      if (currentTab === 'collection') {
        updateCollectionDisplay();
      }

      // 全部集めたらお祝い
      if (visitedLocations.size === locations.length) {
        setTimeout(() => {
          showStatus(getText('allComplete'), 'success');
          playCompletionSound();
          createCompletionEffect();
        }, 1200);
      }
    }
  } else {
    const need = Math.max(0, Math.round(dist - loc.radius));
    showStatus(getText('needApproach', { distance: need }), 'error');
    playErrorSound();
  }
}

// ===== Audio functions =====
function tryAutoPlayBGM() {
  const bgm = document.getElementById('bgm');
  if (!bgm) return;
  
  bgm.loop = true;
  const playPromise = bgm.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      const onGesture = () => { 
        bgm.play().catch(() => {}); 
        document.removeEventListener('click', onGesture); 
        document.removeEventListener('touchstart', onGesture); 
      };
      document.addEventListener('click', onGesture);
      document.addEventListener('touchstart', onGesture);
    });
  }
}

function playStampSound() {
  try {
    const audio = new Audio();
    audio.src = 'Sounds/one_getting.mp3';
    audio.volume = 0.7;
    audio.play().catch(() => {
      // フォールバック：シンプルな音を生成
      createSimpleBeep(880, 0.3);
    });
  } catch (e) {
    createSimpleBeep(880, 0.3);
  }
}

function playErrorSound() {
  try {
    const audio = new Audio();
    audio.src = 'Sounds/missing_location.mp3';
    audio.volume = 0.5;
    audio.play().catch(() => {
      createSimpleBeep(220, 0.5);
    });
  } catch (e) {
    createSimpleBeep(220, 0.5);
  }
}

function playCompletionSound() {
  try {
    const audio = new Audio();
    audio.src = 'Sounds/gameclear.mp3';
    audio.volume = 0.8;
    audio.play().catch(() => {
      createVictoryBeep();
    });
  } catch (e) {
    createVictoryBeep();
  }
}

function createSimpleBeep(frequency, duration) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    setTimeout(() => {
      try { audioContext.close(); } catch (e) {}
    }, duration * 1000 + 100);
  } catch (e) {
    console.warn('Audio creation failed:', e);
  }
}

function createVictoryBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = [523, 659, 784, 1047]; // C, E, G, C
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }, index * 200);
    });
    
    setTimeout(() => {
      try { audioContext.close(); } catch (e) {}
    }, 1200);
  } catch (e) {
    console.warn('Victory sound creation failed:', e);
  }
}

// ===== Display and persistence =====
function updateDisplay() { 
  if (locations.length === 0) return;
  
  const progress = (visitedLocations.size / locations.length) * 100; 
  
  const stampCount = document.getElementById('stampCount'); 
  if (stampCount) stampCount.textContent = visitedLocations.size; 
  
  const progressFill = document.getElementById('progressFill'); 
  if (progressFill) progressFill.style.width = progress + '%'; 
  
  locations.forEach((loc, i) => { 
    const card = document.getElementById(`location-${i}`); 
    if (visitedLocations.has(i)) { 
      if (card) card.classList.add('visited'); 
      
      const btn = document.getElementById(`checkBtn-${i}`); 
      if (btn) { 
        btn.textContent = getText('acquired'); 
        btn.disabled = true; 
        btn.classList.remove('pulse'); 
      } 
    } else { 
      if (card) card.classList.remove('visited'); 
    } 
  }); 
}

let statusTimeout = null;
function showStatus(message, type) { 
  const el = document.getElementById('statusMessage'); 
  if (!el) return; 
  
  el.textContent = message; 
  el.className = `status ${type}`; 
  el.style.display = 'block'; 
  
  if (statusTimeout) clearTimeout(statusTimeout); 
  statusTimeout = setTimeout(clearStatus, 5000); 
}

function clearStatus() { 
  const el = document.getElementById('statusMessage'); 
  if (el) el.style.display = 'none'; 
}

function saveData() { 
  const data = { 
    visitedLocations: Array.from(visitedLocations), 
    timestamp: new Date().toISOString() 
  }; 
  
  try { 
    localStorage.setItem('stampRallyData', JSON.stringify(data)); 
  } catch (e) { 
    console.warn('Failed to save data to localStorage:', e);
    window.stampRallyData = data; 
  } 
}

function saveLanguage() { 
  try { 
    localStorage.setItem('stampRallyLanguage', currentLanguage); 
  } catch (e) { 
    console.warn('Failed to save language to localStorage:', e);
    window.stampRallyLanguage = currentLanguage; 
  } 
}

function loadSavedData() { 
  try { 
    const rawData = localStorage.getItem('stampRallyData'); 
    if (rawData) { 
      const parsed = JSON.parse(rawData); 
      visitedLocations = new Set((parsed.visitedLocations || []).map(x => Number(x))); 
    } 
    
    const savedLanguage = localStorage.getItem('stampRallyLanguage'); 
    if (savedLanguage) { 
      currentLanguage = savedLanguage; 
      const select = document.getElementById('languageSelect'); 
      if (select) select.value = currentLanguage; 
    } 
  } catch (e) { 
    console.warn('Failed to load saved data:', e); 
  } 
}

// ===== Effects =====
function createCompletionEffect() { 
  for (let i = 0; i < 20; i++) { 
    setTimeout(() => createFirework(), i * 100); 
  } 
}

function createFirework() { 
  const firework = document.createElement('div'); 
  firework.style.position = 'fixed'; 
  firework.style.width = '12px'; 
  firework.style.height = '12px'; 
  firework.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`; 
  firework.style.borderRadius = '50%'; 
  firework.style.left = Math.random() * window.innerWidth + 'px'; 
  firework.style.top = Math.random() * window.innerHeight + 'px'; 
  firework.style.zIndex = '1200'; 
  firework.style.pointerEvents = 'none'; 
  firework.style.animation = 'firework 2s ease-out forwards'; 
  
  document.body.appendChild(firework); 
  setTimeout(() => firework.remove(), 2100); 
}

// ===== Debug functions =====
let debugMode = false;
function toggleDebug() { 
  debugMode = !debugMode; 
  const debugButtons = document.getElementById('debug-buttons'); 
  if (debugButtons) debugButtons.style.display = debugMode ? 'flex' : 'none'; 
}

function showCurrentPosition() { 
  if (currentPosition) {
    alert(`現在地: 緯度 ${currentPosition.lat.toFixed(6)}, 経度 ${currentPosition.lng.toFixed(6)}`); 
  } else {
    alert('位置情報を取得中です'); 
  }
}

function debugMarkAll() {
  locations.forEach((loc, i) => {
    visitedLocations.add(i);
  });
  
  saveData();
  updateDisplay();
  
  if (currentTab === 'collection') {
    updateCollectionDisplay();
  }
  
  alert('全スタンプ獲得済みにしました');
}

function debugClearLocal() {
    visitedLocations = new Set(); 
    saveData(); 
    updateDisplay(); 
  
    if (currentTab === 'collection') {
      updateCollectionDisplay();
    }
  
    alert('✅ ローカルのスタンプデータをクリアしました'); 
    userSyncManager.showSyncStatus('success', 'ローカルデータをクリアしました');
}

async function debugClearAll() { 
    if (!confirm('本当にローカルとサーバーの全データをクリアしますか？')) {
        return;
    }
    
    try {
        const response = await fetch(`${userSyncManager.API_BASE.replace('/api', '')}/api/debug/reset-data`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // ローカルのデータもクリア
            debugClearLocal();
            // ユーザーIDもリセット
            localStorage.removeItem('stampRallyUserId');
            userSyncManager.userId = null;
            
            alert('🎉 サーバーとローカルの全スタンプデータをクリアしました。');
            userSyncManager.showSyncStatus('success', '全データをクリアしました');
            window.location.reload(); // ページをリロードして再初期化
        } else {
            throw new Error(result.error || 'サーバーデータのクリアに失敗しました');
        }
    } catch (error) {
        console.error('❌ データリセットエラー:', error);
        alert(`❌ データリセットに失敗しました: ${error.message}`);
    }
}

// ===== Event listeners =====
window.addEventListener('beforeunload', () => { 
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId); 
  }
  
  // 同期マネージャーの停止
  userSyncManager.stopAutoSync();
});
