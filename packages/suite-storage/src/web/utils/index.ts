export const isDBAvailable = (cb: (isAvailable: boolean) => void) => {
    // Firefox doesn't support indexedDB while in incognito mode, but still returns valid window.indexedDB object.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=781982
    // so we need to try accessing the IDB. try/catch around idb.open() does not catch the error (bug in idb?), that's why we use callbacks.
    // this solution calls callback function from within onerror/onsuccess event handlers.
    // For other browsers checking the window.indexedDB should be enough.
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
        const r = indexedDB.open('test');
        r.onerror = () => cb(false);
        r.onsuccess = () => cb(true);
    } else {
        cb(!!indexedDB);
    }
};
