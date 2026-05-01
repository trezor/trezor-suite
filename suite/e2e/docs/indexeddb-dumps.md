# IndexedDB dumps for E2E tests

`IndexedDbFixture.seedFromDump()` restores a captured snapshot of the Suite
IndexedDB (`trezor-suite`) into the browser used by a Playwright test. This is
useful for starting a test from a non-trivial wallet state (e.g. remembered
wallets, cached metadata) without having to recreate it via UI interactions.

## Dump format

The dump is a JSON file with the following shape (v1):

```json
{
    "version": 1,
    "stores": {
        "<storeName>": [
            {
                "key": "...",
                "value": {
                    /* ... */
                }
            }
        ]
    }
}
```

- `stores` contains one entry per IndexedDB object store.
- `key` is only used when the store has no `keyPath` (i.e. out-of-line keys);
  otherwise it is ignored and the key is read from `value`.

## How to create a dump

1. Open Suite in the browser (e.g. http://localhost:8000) and bring it to the
   wallet state you want to capture.
2. Open DevTools > Console and run:

    ```js
    (async () => {
        const db = await new Promise((resolve, reject) => {
            const req = indexedDB.open('trezor-suite');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        const stores = [...db.objectStoreNames];
        const result = { version: 1, stores: {} };

        for (const storeName of stores) {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const entries = await new Promise((resolve, reject) => {
                const rows = [];
                const req = store.openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) {
                        resolve(rows);
                        return;
                    }
                    rows.push({ key: cursor.key, value: cursor.value });
                    cursor.continue();
                };
                req.onerror = () => reject(req.error);
            });
            result.stores[storeName] = entries;
        }

        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trezor-suite-db.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log('Exported stores:', stores);
    })();
    ```

3. Save the downloaded `trezor-suite-db.json` under `suite/e2e/fixtures/`.
4. Import the JSON file in your test and pass it to
   [`IndexedDbFixture.seedFromDump()`](../support/indexedDb.ts).
