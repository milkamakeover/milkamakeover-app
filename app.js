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

// पॉप-अप इंडिकेटर को अपडेट करने का फंक्शन
function updateSyncStatus(isSuccess) {
    const syncBtn = document.querySelector('[class*="sync"]');
    if (syncBtn) {
        if (isSuccess) {
            syncBtn.style.backgroundColor = "#25d366";
            syncBtn.textContent = "🟢 Synced";
        } else {
            syncBtn.style.backgroundColor = "#e53935";
            syncBtn.textContent = "🔴 Sync failed";
        }
    }
}

// 1. फ़ंक्शन: लोकल डेटा को क्लाउड पर अपलोड करना
async function syncLocalToCloud() {
    let successCount = 0;
    for (const key of salonKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                await setDoc(doc(db, "milka_salon_data", key), {
                    data: JSON.parse(localData),
                    lastUpdated: new Date().toISOString()
                });
                successCount++;
            } catch (e) { 
                console.error("Upload error for " + key + ":", e); 
            }
        } else {
            successCount++;
        }
    }
    updateSyncStatus(successCount === salonKeys.length);
}

// 2. फ़ंक्शन: ऐप चालू होते ही क्लाउड से सारा डेटा तुरंत डाउनलोड करना
async function loadFromCloudOnStartup() {
    console.log("Downloading data from cloud...");
    let loadedAny = false;
    for (const key of salonKeys) {
        try {
            const docSnap = await getDoc(doc(db, "milka_salon_data", key));
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                localStorage.setItem(key, JSON.stringify(cloudContent));
                loadedAny = true;
            }
        } catch (e) { 
            console.error("Startup load error:", e); 
        }
    }
    
    // डेटा डाउनलोड होने के बाद इंटरफ़ेस रिफ्रेश करना
    window.dispatchEvent(new Event('storage'));
    if (typeof window.renderAll === "function") { window.renderAll(); }
    if (typeof window.checkPinlock === "function") { window.checkPinlock(); }
    
    if (loadedAny) {
        updateSyncStatus(true);
    }
}

// 3. फ़ंक्शन: लाइव बदलावों को रियलटाइम में सुनना
function listenToCloudChanges() {
    salonKeys.forEach((key) => {
        onSnapshot(doc(db, "milka_salon_data", key), (docSnap) => {
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                const localContent = localStorage.getItem(key);
                if (JSON.stringify(cloudContent) !== localContent) {
                    localStorage.setItem(key, JSON.stringify(cloudContent));
                    window.dispatchEvent(new Event('storage'));
                    if (typeof window.renderAll === "function") { window.renderAll(); }
                    updateSyncStatus(true);
                }
            }
        }, (error) => {
            console.error("Live sync snapshot error:", error);
            updateSyncStatus(false);
        });
    });
}

// जब भी कोई बटन दबे या एंट्री हो, डेटा क्लाउड पर जाए
window.addEventListener('click', () => { setTimeout(syncLocalToCloud, 800); });
window.addEventListener('keyup', () => { setTimeout(syncLocalToCloud, 800); });

// ऐप शुरू होते ही दोनों फ़ंक्शन रन करें
loadFromCloudOnStartup().then(() => {
    listenToCloudChanges();
}).catch(() => {
    updateSyncStatus(false);
});
