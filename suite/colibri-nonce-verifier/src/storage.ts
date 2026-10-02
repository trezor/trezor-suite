import fs from 'node:fs';
import path from 'node:path';

// Colibri persists its sync-committee state through this synchronous key/value interface. Keys
// come from the C core (`states_1`, `sync_1_1393`, `code_<hash>`); anything else is refused so a
// malformed key can never escape the storage directory.
export type ColibriStorage = {
    get: (key: string) => Uint8Array | null;
    set: (key: string, value: Uint8Array) => void;
    del: (key: string) => void;
};

// Bump when the on-disk layout Colibri writes is no longer compatible with an older verifier build.
export const STORAGE_SCHEMA_VERSION = 1;

const STORAGE_KEY = /^[A-Za-z0-9_]{1,128}$/;
const POLICY_ID = /^[A-Za-z0-9._-]{1,64}$/;

export type GetStorageDirectoryParams = {
    appDataDirectory: string;
    chainId: string;
    trustPolicyId: string;
};

// A consensus cache is only meaningful under the trust policy that bootstrapped it, so every
// policy (and schema) gets its own directory; changing the manifest forces a clean bootstrap.
export const getStorageDirectory = ({
    appDataDirectory,
    chainId,
    trustPolicyId,
}: GetStorageDirectoryParams): string | null => {
    if (!POLICY_ID.test(trustPolicyId) || !/^[0-9]{1,10}$/.test(chainId)) return null;

    return path.join(
        appDataDirectory,
        'colibri',
        `chain-${chainId}`,
        `policy-${trustPolicyId}`,
        `schema-${STORAGE_SCHEMA_VERSION}`,
    );
};

export const createFileStorage = (directory: string): ColibriStorage => {
    const resolve = (key: string) => (STORAGE_KEY.test(key) ? path.join(directory, key) : null);

    return {
        get: key => {
            const file = resolve(key);
            if (!file) return null;
            try {
                return new Uint8Array(fs.readFileSync(file));
            } catch {
                return null;
            }
        },
        set: (key, value) => {
            const file = resolve(key);
            if (!file) return;
            fs.mkdirSync(directory, { recursive: true });
            // Write-then-rename so a crash mid-write never leaves a truncated sync state behind.
            const temporary = `${file}.${process.pid}.tmp`;
            fs.writeFileSync(temporary, value);
            fs.renameSync(temporary, file);
        },
        del: key => {
            const file = resolve(key);
            if (!file) return;
            fs.rmSync(file, { force: true });
        },
    };
};

// Colibri keeps the list of synced committee periods under `states_<chainId>`; its presence is
// what separates a warm verification from a cold bootstrap.
export const hasSyncState = (storage: ColibriStorage, chainId: bigint) =>
    storage.get(`states_${chainId}`) !== null;

export const createMemoryStorage = (initial: Record<string, Uint8Array> = {}): ColibriStorage => {
    const entries = new Map(Object.entries(initial));

    return {
        get: key => entries.get(key) ?? null,
        set: (key, value) => {
            entries.set(key, new Uint8Array(value));
        },
        del: key => {
            entries.delete(key);
        },
    };
};
