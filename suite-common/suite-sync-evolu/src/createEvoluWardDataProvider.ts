import { type Evolu, createIdFromString, createQueryBuilder, getOrThrow } from '@evolu/common';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { AuthLabelEntry, AuthLabelProvider, AuthLabelRow, TreeState } from '@trezor/ward';

import { WardMetaEvoluSchema, createWardMetaId } from './data/wardMetaTable';
import { WardRootEvoluSchema, WardRootId } from './data/wardRootTable';
import { Schema } from './schema';

/**
 * Evolu-backed WARD data provider (D1). Implements the `AuthLabelProvider` contract
 * that @trezor/connect consumes via `updateConnectSettings({ wardDataProvider })`,
 * reading/writing the additive `wardMeta` / `wardRoot` tables on the owner's Evolu
 * instance. Lives here (not in suite/suite-sync) because it must touch Evolu
 * internals, which this package deliberately does not leak — suite/suite-sync only
 * wires it (creates it from the instance and injects it into Connect).
 *
 * One provider per Evolu owner (= one wallet), so the `walletId` argument on each
 * call is not used to scope — the instance already is the wallet's store.
 *
 * counter is stored stringified (see the table defs); the provider converts at the
 * boundary. Writes are local (Evolu syncs them eventually) — the durability model
 * from WM-evolu-callback.md (local write → eventual sync → convergent reconcile).
 */

const createQuery = createQueryBuilder(Schema);
const wardMetaQuery = createQuery(db => db.selectFrom('wardMeta').selectAll());
const wardRootQuery = createQuery(db => db.selectFrom('wardRoot').selectAll());

// The WARD root checkpoint is a per-owner singleton row.
const WARD_ROOT_ID = getOrThrow(WardRootId.from(createIdFromString('ward-root')));

export const createEvoluWardDataProvider = (evolu: Evolu<typeof Schema>): AuthLabelProvider => {
    const getAllEntries = async (_walletId: string): Promise<AuthLabelRow[]> => {
        const rows = await evolu.loadQuery(wardMetaQuery);
        const out: AuthLabelRow[] = [];
        for (const r of rows) {
            if (r.address === null || r.networkSymbol === null || r.counter === null) continue;
            out.push({
                address: r.address,
                networkSymbol: r.networkSymbol,
                entry: {
                    metadata: {
                        label: r.label ?? undefined,
                        data_mac: r.dataMac ?? undefined,
                    },
                    counter: Number(r.counter),
                },
            });
        }

        return out;
    };

    const lookup = async (
        walletId: string,
        address: string,
        networkSymbol: string,
    ): Promise<AuthLabelEntry | null> => {
        const rows = await getAllEntries(walletId);
        const found = rows.find(r => r.address === address && r.networkSymbol === networkSymbol);

        return found ? found.entry : null;
    };

    const upsert = (
        _walletId: string,
        address: string,
        networkSymbol: string,
        entry: AuthLabelEntry,
    ): void => {
        const row = WardMetaEvoluSchema.from({
            id: getOrThrow(createWardMetaId(address, networkSymbol as NetworkSymbol)),
            address,
            networkSymbol,
            label: entry.metadata.label ?? null,
            counter: String(entry.counter),
            dataMac: entry.metadata.data_mac ?? null,
        });
        evolu.upsert('wardMeta', getOrThrow(row));
    };

    const getTreeState = async (_walletId: string): Promise<TreeState | null> => {
        const rows = await evolu.loadQuery(wardRootQuery);
        const r = rows.find(x => x.id === WARD_ROOT_ID);
        if (!r) return null;

        return {
            root: r.root ?? '',
            counter: Number(r.counter),
            mac: r.mac ?? undefined,
        };
    };

    const setTreeState = (_walletId: string, state: TreeState): void => {
        const row = WardRootEvoluSchema.from({
            id: WARD_ROOT_ID,
            root: state.root ?? null,
            counter: String(state.counter),
            mac: state.mac ?? null,
        });
        evolu.upsert('wardRoot', getOrThrow(row));
    };

    return { lookup, upsert, getAllEntries, getTreeState, setTreeState };
};
