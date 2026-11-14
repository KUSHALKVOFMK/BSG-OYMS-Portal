/* Local preview file storage: IndexedDB replaces the old 1 MB localStorage limits.
   Files remain on this browser/device until a shared cloud backend is connected. */
(function (global) {
  const DB_NAME = "kvs_oyms_preview_files_v2";
  const DB_VERSION = 2;
  const CIRCULARS = "circulars";
  const GALLERY = "gallery";
  const SLIDES = "slides";
  const LEGACY_CIRCULARS = "kvs_oyms_demo_circulars_v1";
  const LEGACY_GALLERY = "kvs_oyms_demo_gallery_v1";
  const MIGRATION_KEY = "kvs_oyms_idb_migrated_v2";
  let dbPromise;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!("indexedDB" in global)) {
        reject(new Error("This browser does not support IndexedDB file storage."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(CIRCULARS)) db.createObjectStore(CIRCULARS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(GALLERY)) db.createObjectStore(GALLERY, { keyPath: "id" });
        if (!db.objectStoreNames.contains(SLIDES)) db.createObjectStore(SLIDES, { keyPath: "id" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Could not open browser file storage.")); };
    });
    return dbPromise;
  }

  function transaction(storeName, mode, action) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result;
        try { result = action(store); } catch (error) { reject(error); return; }
        tx.oncomplete = function () { resolve(result && result.result !== undefined ? result.result : result); };
        tx.onerror = function () { reject(tx.error || new Error("Browser storage transaction failed.")); };
        tx.onabort = function () { reject(tx.error || new Error("Browser storage transaction was cancelled.")); };
      });
    });
  }

  async function all(storeName) {
    const db = await openDb();
    return new Promise(function (resolve, reject) {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = function () { resolve(request.result || []); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function put(storeName, record) {
    return transaction(storeName, "readwrite", function (store) { return store.put(record); });
  }

  function remove(storeName, id) {
    return transaction(storeName, "readwrite", function (store) { return store.delete(id); });
  }

  async function dataUrlToBlob(dataUrl) {
    if (!dataUrl) return null;
    const response = await fetch(dataUrl);
    return response.blob();
  }

  async function migrateLegacyData() {
    if (localStorage.getItem(MIGRATION_KEY) === "yes") return;
    try {
      const oldCirculars = JSON.parse(localStorage.getItem(LEGACY_CIRCULARS) || "[]");
      for (const item of oldCirculars) {
        const record = Object.assign({}, item);
        if (record.fileData && !record.fileBlob) record.fileBlob = await dataUrlToBlob(record.fileData);
        delete record.fileData;
        await put(CIRCULARS, record);
      }
      const oldGallery = JSON.parse(localStorage.getItem(LEGACY_GALLERY) || "[]");
      for (const item of oldGallery) {
        const record = Object.assign({}, item);
        if (record.imageData && !record.imageBlob) record.imageBlob = await dataUrlToBlob(record.imageData);
        delete record.imageData;
        await put(GALLERY, record);
      }
      localStorage.setItem(MIGRATION_KEY, "yes");
    } catch (error) {
      console.warn("Legacy preview data migration could not finish.", error);
    }
  }

  async function estimate() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const info = await navigator.storage.estimate();
        return { usage: info.usage || 0, quota: info.quota || 0, available: Math.max(0, (info.quota || 0) - (info.usage || 0)) };
      }
    } catch (error) {}
    return { usage: 0, quota: 0, available: 0 };
  }

  async function requestPersistentStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
    } catch (error) {}
    return false;
  }

  function formatBytes(bytes) {
    if (!bytes) return "Not reported by this browser";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes, index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
    return value.toFixed(index === 0 ? 0 : 1) + " " + units[index];
  }

  async function init() {
    await openDb();
    await migrateLegacyData();
    return true;
  }

  global.PortalStorage = {
    init: init,
    allCirculars: function () { return all(CIRCULARS); },
    saveCircular: function (record) { return put(CIRCULARS, record); },
    removeCircular: function (id) { return remove(CIRCULARS, id); },
    allPhotos: function () { return all(GALLERY); },
    savePhoto: function (record) { return put(GALLERY, record); },
    removePhoto: function (id) { return remove(GALLERY, id); },
    allSlides: function () { return all(SLIDES); },
    saveSlide: function (record) { return put(SLIDES, record); },
    removeSlide: function (id) { return remove(SLIDES, id); },
    estimate: estimate,
    formatBytes: formatBytes,
    requestPersistentStorage: requestPersistentStorage
  };
})(window);