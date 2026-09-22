import { initializeApp } from "https://gstatic.com";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyBeqfL0egPyTmbxN4p_xq7Qhj8LNb-Qx3k",
  authDomain: "://firebaseapp.com",
  projectId: "milka-makeover",
  storageBucket: "milka-makeover.firebasestorage.app",
  messagingSenderId: "594495486205",
  appId: "1:594495486205:web:2688da620f2c17f3ed6694",
  measurementId: "G-1MN11RNKXK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const salonKeys = ['appointments', 'clients', 'products', 'sales', 'expenses', 'purchases', 'staff', 'services', 'settings'];

function forceUIRefresh(isSuccess) {
    const syncBtn = document.getElementById('sync-btn') || document.querySelector('[onclick*="sync"]');
    if (syncBtn) {
        if (isSuccess) {
            syncBtn.style.backgroundColor = "#25d366";
            syncBtn.innerHTML = `🟢 Synced`;
        } else {
            syncBtn.style.backgroundColor = "#e53935";
            syncBtn.innerHTML = `🔴 Sync failed`;
        }
    }
}

// ऐप के इंटरफ़ेस को जबरदस्ती अपडेट (DOM Reload) करने का फ़ंक्शन
function triggerAppRender() {
    window.dispatchEvent(new Event('storage'));
    
    // आपके HTML कोड के संभावित सभी मुख्य रेंडर फ़ंक्शंस को कॉल करना
    const functionsToCall = [
        'renderAll', 'loadData', 'renderAppointments', 'renderClients', 
        'initApp', 'checkPinlock', 'updateDashboard', 'showData'
    ];
    
    functionsToCall.forEach(funcName => {
        if (typeof window[funcName] === "function") {
            try { window[funcName](); } catch(e) { console.log(funcName + " load skip"); }
        }
    });
}

// 1. फ़ंक्शन: लोकल डेटा को फायरबेस पर अपलोड करना
async function syncLocalToCloud() {
    let successCount = 0;
    for (const key of salonKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                await setDoc(doc(db, "salon_records", key), {
                    data: JSON.parse(localData),
                    lastUpdated: new Date().toISOString()
                });
                successCount++;
            } catch (e) { console.error(e); }
        } else {
            successCount++;
        }
    }
    forceUIRefresh(successCount === salonKeys.length);
}

// 2. फ़ंक्शन: ऐप चालू होते ही डेटा डाउनलोड करके ज़बरदस्ती रीड कराना
async function loadFromCloudOnStartup() {
    let loadedAny = false;
    for (const key of salonKeys) {
        try {
            const docSnap = await getDoc(doc(db, "salon_records", key));
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                localStorage.setItem(key, JSON.stringify(cloudContent));
                loadedAny = true;
            }
        } catch (e) { console.error(e); }
    }
    
    triggerAppRender();
    if (loadedAny) { forceUIRefresh(true); }
}

// 3. फ़ंक्शन: लाइव बदलावों को रियलटाइम सिंक करना
function listenToCloudChanges() {
    salonKeys.forEach((key) => {
        onSnapshot(doc(db, "salon_records", key), (docSnap) => {
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                const localContent = localStorage.getItem(key);
                if (JSON.stringify(cloudContent) !== localContent) {
                    localStorage.setItem(key, JSON.stringify(cloudContent));
                    triggerAppRender();
                    forceUIRefresh(true);
                }
            }
        }, () => { forceUIRefresh(false); });
    });
}

window.addEventListener('click', () => { setTimeout(syncLocalToCloud, 600); });
window.addEventListener('keyup', () => { setTimeout(syncLocalToCloud, 600); });

loadFromCloudOnStartup().then(() => {
    listenToCloudChanges();
}).catch(() => { forceUIRefresh(false); });
