import { initializeApp } from "https://gstatic.com";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://gstatic.com";

// Firebase Configuration (Milka Makeover)
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

const repoName = "milkamakeover-app";
const salonKeys = ['appointments', 'clients', 'products', 'sales', 'expenses', 'purchases', 'staff', 'services', 'settings'];

// आपके HTML के मूल सिंक बटन (UI) को कंट्रोल करने का फंक्शन
function forceUIRefresh(isSuccess, message = "") {
    const syncBtn = document.getElementById('sync-btn') || document.querySelector('[onclick*="sync"]');
    if (syncBtn) {
        if (isSuccess) {
            syncBtn.className = "nav-btn sync-success";
            syncBtn.style.backgroundColor = "#25d366";
            syncBtn.innerHTML = `🟢 Synced`;
        } else {
            syncBtn.className = "nav-btn sync-failed";
            syncBtn.style.backgroundColor = "#e53935";
            syncBtn.innerHTML = `🔴 ${message || 'Sync failed'}`;
        }
    }
}

// 1. फ़ंक्शन: लोकल डेटा को फायरबेस पर अपलोड करना
async function syncLocalToCloud() {
    let successCount = 0;
    for (const key of salonKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                await setDoc(doc(db, repoName, key), {
                    data: JSON.parse(localData),
                    lastUpdated: new Date().toISOString()
                });
                successCount++;
            } catch (e) { 
                console.error("Upload error:", e); 
            }
        } else {
            successCount++;
        }
    }
    forceUIRefresh(successCount === salonKeys.length);
}

// 2. फ़ंक्शन: ऐप चालू होते ही क्लाउड से डेटा तुरंत खींचना
async function loadFromCloudOnStartup() {
    let loadedAny = false;
    for (const key of salonKeys) {
        try {
            const docSnap = await getDoc(doc(db, repoName, key));
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                localStorage.setItem(key, JSON.stringify(cloudContent));
                loadedAny = true;
            }
        } catch (e) { 
            console.error("Startup load error:", e); 
        }
    }
    
    // ऐप के इंटरफ़ेस और रेंडर फंक्शन्स को ट्रिगर करना
    window.dispatchEvent(new Event('storage'));
    if (typeof window.renderAll === "function") { window.renderAll(); }
    if (typeof window.checkPinlock === "function") { window.checkPinlock(); }
    
    if (loadedAny) {
        forceUIRefresh(true);
    }
}

// 3. फ़ंक्शन: लाइव बदलावों को रियलटाइम में सुनना
function listenToCloudChanges() {
    salonKeys.forEach((key) => {
        onSnapshot(doc(db, repoName, key), (docSnap) => {
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                const localContent = localStorage.getItem(key);
                if (JSON.stringify(cloudContent) !== localContent) {
                    localStorage.setItem(key, JSON.stringify(cloudContent));
                    window.dispatchEvent(new Event('storage'));
                    if (typeof window.renderAll === "function") { window.renderAll(); }
                    forceUIRefresh(true);
                }
            }
        }, (error) => {
            console.error("Snapshot error:", error);
            forceUIRefresh(false);
        });
    });
}

// गिटहब रेपो और क्लिक इवेंट्स को आपस में बांधना
window.addEventListener('click', () => { setTimeout(syncLocalToCloud, 600); });
window.addEventListener('keyup', () => { setTimeout(syncLocalToCloud, 600); });

// सिस्टम चालू करें
loadFromCloudOnStartup().then(() => {
    listenToCloudChanges();
}).catch(() => {
    forceUIRefresh(false);
});
