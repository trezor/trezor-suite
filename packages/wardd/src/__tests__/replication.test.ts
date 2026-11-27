/**
 * RelayLink: what wardd says about replication, from the events the relay connection shows.
 */
import { WARD_STORAGE_INCREMENT } from '@trezor/ward-core';

import { RelayLink, type RelayLinkOptions } from '../replication';

const GRACE = 20;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const relayLink = (overrides: Partial<RelayLinkOptions> = {}) => {
    const state = {
        limit: 100_000 as number | null,
        starts: 0,
        resyncs: 0,
        stored: 1_000,
        skew: 0,
    };
    const link = new RelayLink({
        ownerId: 'owner',
        hasRelay: true,
        askLimit: () => Promise.resolve(state.limit),
        start: () => {
            state.starts += 1;
        },
        resync: () => {
            state.resyncs += 1;
        },
        storedBytes: () => state.stored,
        graceMs: GRACE,
        settleMs: GRACE,
        now: () => Date.now() + state.skew,
        ...overrides,
    });

    return { link, state };
};

/** Started, connected, and the first full synchronization answered without a refusal. */
const synchronized = async (link: RelayLink) => {
    await link.status(); // starts it: the owner is funded
    link.opened();
    link.answered();
    await wait(GRACE * 2);
};

describe('RelayLink', () => {
    it('reports a store without a relay as local', async () => {
        const { link } = relayLink({ hasRelay: false });
        link.stored('a');
        expect(await link.status()).toMatchObject({
            state: 'local',
            reason: 'no_relay',
            waiting: 0,
        });
    });

    it('connects an unfunded owner only once the Quota Manager funds it', async () => {
        const { link, state } = relayLink();
        state.limit = null;
        link.begin();
        await wait(1);
        expect(state.starts).toBe(0);
        expect(await link.status()).toMatchObject({ reason: 'no_registration' });
        expect(state.starts).toBe(0);
        state.limit = 65_536;
        await link.status();
        expect(state.starts).toBe(1);
        await link.status();
        expect(state.starts).toBe(1);
        link.close();
    });

    it('connects at once without a Quota Manager, or when it cannot be asked', async () => {
        const without = relayLink({ askLimit: undefined });
        without.link.begin();
        expect(without.state.starts).toBe(1);
        const down = relayLink({ askLimit: () => Promise.reject(new Error('down')) });
        down.link.begin();
        await wait(GRACE * 2);
        expect(down.state.starts).toBe(1);
        down.link.close();
    });

    it('replicates once connected and answered', async () => {
        const { link } = relayLink();
        link.stored('a');
        expect(await link.status()).toMatchObject({
            state: 'not_replicating',
            reason: 'relay_unreachable',
            waiting: 1,
        });
        await synchronized(link);
        expect(await link.status()).toMatchObject({
            state: 'replicating',
            waiting: 0,
            needBytes: 0,
        });
    });

    it('names a missing registration and asks for a first allocation', async () => {
        const { link, state } = relayLink();
        state.limit = null;
        link.stored('a');
        expect(await link.status()).toMatchObject({
            state: 'not_replicating',
            reason: 'no_registration',
            limitBytes: null,
            waiting: 1,
            needBytes: WARD_STORAGE_INCREMENT,
        });
    });

    it('counts the writes a refusal concerns, and those after it', async () => {
        const { link, state } = relayLink();
        await link.status(); // caches the limit the relay will refuse under
        await synchronized(link);
        link.stored('before'); // long enough ago to have been accepted
        await wait(GRACE * 2);
        link.stored('refused');
        state.limit = 1_000;
        link.refusedForQuota();
        link.refusedForQuota(); // reported twice by Evolu: one refusal
        link.stored('after');
        const status = await link.status();
        expect(status).toMatchObject({
            state: 'not_replicating',
            reason: 'quota_full',
            waiting: 2,
        });
        expect(status.needBytes).toBeGreaterThan(0);
    });

    it('resynchronizes once the owner has more storage, and then nothing waits', async () => {
        const { link, state } = relayLink();
        await synchronized(link);
        state.limit = 1_000;
        link.stored('refused');
        link.refusedForQuota();
        await wait(1); // the refusal's own look at the limit
        expect(await link.status()).toMatchObject({ reason: 'quota_full' });
        expect(state.resyncs).toBe(0);

        state.limit = 70_000;
        expect(await link.status()).toMatchObject({ state: 'replicating', waiting: 1 });
        expect(state.resyncs).toBe(1);
        link.answered();
        await wait(GRACE * 2);
        expect(await link.status()).toMatchObject({ state: 'replicating', waiting: 0 });
    });

    it('keeps records waiting when the resync is refused again', async () => {
        const { link, state } = relayLink();
        await synchronized(link);
        state.limit = 1_000;
        link.stored('refused');
        link.refusedForQuota();
        await wait(1);
        state.limit = 2_000;
        await link.status();
        link.refusedForQuota();
        link.answered();
        await wait(GRACE * 2);
        expect(await link.status()).toMatchObject({ reason: 'quota_full', waiting: 1 });
    });

    it('does not resync on a limit the Quota Manager could not report', async () => {
        const { link, state } = relayLink({ askLimit: () => Promise.reject(new Error('down')) });
        await synchronized(link);
        link.stored('refused');
        link.refusedForQuota();
        await wait(1);
        expect(await link.status()).toMatchObject({ reason: 'quota_full', waiting: 1 });
        expect(state.resyncs).toBe(0);
    });

    it('reports a lost connection, and the writes made while it was down', async () => {
        const { link } = relayLink();
        await synchronized(link);
        link.disconnected();
        link.stored('a');
        expect(await link.status()).toMatchObject({ reason: 'relay_unreachable', waiting: 1 });
        await synchronized(link);
        expect(await link.status()).toMatchObject({ state: 'replicating', waiting: 0 });
    });

    it('asks for more storage before the relay refuses', async () => {
        const { link, state } = relayLink();
        await synchronized(link);
        state.limit = 64 * 1024;
        state.stored = 60 * 1024;
        state.skew = 10_000; // past the cached limit
        expect(await link.status()).toMatchObject({
            state: 'replicating',
            needBytes: WARD_STORAGE_INCREMENT,
        });
    });
});
