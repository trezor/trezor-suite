import { type MMKVStorageDep } from './mmkvStorage';

type PersistedState = Record<string, unknown>;

export type DeferrablePersistStorageDeps = MMKVStorageDep;

/**
 * Storage for a persisted reducer configured with `serialize: false`. Redux-persist hands it the
 * state objects, so that while writes are deferred, the state is neither serialized nor written.
 * The stored format is the same as with the default redux-persist serialization.
 */
export type DeferrablePersistStorage = {
    getItem: (key: string) => Promise<PersistedState | undefined>;
    setItem: (key: string, state: PersistedState) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    /** Keeps only the latest state of every key in memory until the writes are resumed. */
    deferWrites: () => void;
    /** Writes the deferred states once and writes immediately from now on. */
    resumeWrites: () => Promise<void>;
    /** Writes the deferred states once and keeps deferring further writes. */
    flushWrites: () => Promise<void>;
};

export type DeferrablePersistStorageDep = { deferrablePersistStorage: DeferrablePersistStorage };

// Matches the default redux-persist serialization: every key is a JSON string inside a JSON object.
const serializePersistedState = (state: PersistedState) =>
    JSON.stringify(
        Object.fromEntries(
            Object.entries(state).map(([key, value]) => [key, JSON.stringify(value)]),
        ),
    );

const deserializePersistedState = (serialized: string): PersistedState =>
    Object.fromEntries(
        Object.entries(JSON.parse(serialized) as Record<string, string>).map(([key, value]) => [
            key,
            JSON.parse(value),
        ]),
    );

export const createDeferrablePersistStorage = (
    deps: DeferrablePersistStorageDeps,
): DeferrablePersistStorage => {
    let isDeferring = false;
    const deferredStates = new Map<string, PersistedState>();

    const write = (key: string, state: PersistedState) =>
        deps.mmkvStorage.setItem(key, serializePersistedState(state));

    const flushWrites = async () => {
        const states = Array.from(deferredStates);
        deferredStates.clear();

        await Promise.all(states.map(([key, state]) => write(key, state)));
    };

    return {
        getItem: async key => {
            const deferredState = deferredStates.get(key);
            if (deferredState) return deferredState;

            const serialized = await deps.mmkvStorage.getItem(key);

            return serialized ? deserializePersistedState(serialized) : undefined;
        },
        setItem: async (key, state) => {
            if (isDeferring) {
                deferredStates.set(key, state);

                return;
            }

            await write(key, state);
        },
        removeItem: async key => {
            deferredStates.delete(key);
            await deps.mmkvStorage.removeItem(key);
        },
        deferWrites: () => {
            isDeferring = true;
        },
        resumeWrites: () => {
            isDeferring = false;

            return flushWrites();
        },
        flushWrites,
    };
};
