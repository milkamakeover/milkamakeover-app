// ==========================================================
// 1. Firebase Core and Firestore Components Integration
// ==========================================================
import { initializeApp } from "https://gstatic.com";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://gstatic.com";

// ==========================================================
// 2. Your Firebase Configuration (Milka Makeover)
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyBeqfL0egPyTmbxN4p_xq7Qhj8LNb-Qx3k",
  authDomain: "://firebaseapp.com",
  projectId: "milka-makeover",
  storageBucket: "milka-makeover.firebasestorage.app",
  messagingSenderId: "594495486205",
  appId: "1:594495486205:web:2688da620f2c17f3ed6694",
  measurementId: "G-1MN11RNKXK"
};

// Initialize Firebase & Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Milka Makeover Cloud System: Firebase Connected Successfully! 🎉");

// ==========================================================
// 3. Cloud Database Operations (Save & Sync Data)
// ==========================================================

/**
 * Save new data to Firestore Cloud Database
 * @param {string} collectionName - Name of the collection (e.g., 'appointments', 'clients')
 * @param {Object} dataObject - The data to be saved
 */
export async function saveToCloud(collectionName, dataObject) {
    try {
        const finalData = {
            ...dataObject,
            createdAt: new Date().toISOString(),
            deviceSyncTime: new Date()
        };
        
        const docRef = await addDoc(collection(db, collectionName), finalData);
        console.log(`Data saved successfully to cloud! ID: ${docRef.id}`);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error saving data to cloud: ", error);
        return { success: false, error: error.message };
    }
}

/**
 * Realtime Sync Data across all devices
 * @param {string} collectionName - Name of the collection
 * @param {Function} callback - Function that triggers automatically when data changes
 */
export function syncDataWithCloud(collectionName, callback) {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
        const dataList = [];
        snapshot.forEach((doc) => {
            dataList.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Live sync active for ${collectionName}. Total items: ${dataList.length}`);
        callback(dataList);
    }, (error) => {
        console.error("Error with live sync: ", error);
    });
}

// Expose to global scope for application access
window.MilkaCloud = { saveToCloud, syncDataWithCloud };
