import { initializeApp } from "https://gstatic.com";
import { getFirestore, doc, setDoc, onSnapshot } from "https://gstatic.com";

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

async function syncLocalToCloud() {
    for (const key of salonKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                await setDoc(doc(db, "milka_salon_data", key), {
                    data: JSON.parse(localData),
                    lastUpdated: new Date().toISOString()
                });
            } catch (e) { console.error(e); }
        }
    }
}

function listenToCloudChanges() {
    salonKeys.forEach((key) => {
        onSnapshot(doc(db, "milka_salon_data", key), (docSnap) => {
            if (docSnap.exists()) {
                const cloudContent = docSnap.data().data;
                const localContent = localStorage.getItem(key);
                if (JSON.stringify(cloudContent) !== localContent) {
                    localStorage.setItem(key, JSON.stringify(cloudContent));
                    window.dispatchEvent(new Event('storage'));
                }
            }
        });
    });
}

window.addEventListener('click', () => { setTimeout(syncLocalToCloud, 500); });
window.addEventListener('keyup', () => { setTimeout(syncLocalToCloud, 500); });
listenToCloudChanges();
