const VERSION = 1;
// react-native https://facebook.github.io/react-native/docs/asyncstorage.html

// next.js https://medium.com/@filipvitas/indexeddb-with-promises-and-async-await-3d047dddd313

const isIndexedDBAvailable = () => {
    if (!('indexedDB' in window)) {
        return true;
    }
    return false;
};

// TODO: implement upgrade
const onUpgrade = (db: IDBDatabase) => {
    db.createObjectStore('devices', { keyPath: 'id', autoIncrement: true });
};

const openDB = async () => {
    const idb =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB ||
        window.shimIndexedDB;
    // idb.onversionchange = onUpgrade;
    const request = await idb.open('trezor-suite', VERSION);
    return request;
};

const load = async () => {
    if (!isIndexedDBAvailable()) {
        console.warn('IndexedDB not supported');
        return;
    }

    await openDB();

    // db.close();
};
