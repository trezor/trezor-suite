jest.mock('@suite-common/message-system-core', () => ({
    ...jest.requireActual('@suite-common/message-system-core'),
    fetchRemoteConfigJws: jest.fn(),
    verifyConfigJws: jest.fn(),
}));

import { fetchRemoteConfigJws, verifyConfigJws } from '@suite-common/message-system-core';
import type { Action, Localization, MessageSystem } from '@suite-common/suite-types';

import { createMessageSystemOwner } from './message-system';
import type { MessageSystemCache, Store } from '../libs/store';

const content: Localization = { en: '', es: '', cs: '', de: '', fr: '', pt: '' };

const getKillswitchAction = (): Action => ({
    conditions: [],
    message: {
        id: 'killswitch-message',
        priority: 100,
        dismissible: false,
        variant: 'critical',
        category: 'feature',
        content,
        feature: [{ domain: 'killswitch', flag: true }],
    },
});

const getConfig = (sequence: number, actions: Action[]): MessageSystem => ({
    version: 1,
    timestamp: '2026-01-01T00:00:00+00:00',
    sequence,
    actions,
});

const createTestStore = (cache?: MessageSystemCache) => {
    let messageSystemCache = cache;

    return {
        getMessageSystemCache: () => messageSystemCache,
        setMessageSystemCache: jest.fn((nextCache: MessageSystemCache) => {
            messageSystemCache = nextCache;
        }),
    } as unknown as Store & { setMessageSystemCache: jest.Mock };
};

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const createOwner = ({
    store,
    isInterceptorInstalled = true,
}: {
    store: Store;
    isInterceptorInstalled?: boolean;
}) =>
    createMessageSystemOwner({
        store,
        logger: logger as unknown as Parameters<typeof createMessageSystemOwner>[0]['logger'],
        isInterceptorInstalled: () => isInterceptorInstalled,
    });

describe('message system owner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('refuses to fetch the config before the request interceptor is installed', async () => {
        const owner = createOwner({
            store: createTestStore(),
            isInterceptorInstalled: false,
        });

        await owner.acquireRemoteConfig();

        expect(fetchRemoteConfigJws).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
            'message-system',
            expect.stringContaining('request interceptor'),
        );
    });

    it('closes the gate on a killswitch in the persisted config', () => {
        jest.mocked(verifyConfigJws).mockReturnValue(getConfig(10, [getKillswitchAction()]));
        const owner = createOwner({
            store: createTestStore({ configJws: 'persisted-jws', sequence: 10, timestamp: 1 }),
        });

        owner.loadPersistedConfig();

        expect(verifyConfigJws).toHaveBeenCalledWith('persisted-jws');
        expect(owner.getGate()).toStrictEqual({
            isKillswitchActive: true,
            killswitchMessageId: 'killswitch-message',
        });
    });

    it('keeps the gate open when the persisted config does not verify', () => {
        jest.mocked(verifyConfigJws).mockImplementation(() => {
            throw Error('Config authenticity is invalid');
        });
        const owner = createOwner({
            store: createTestStore({ configJws: 'tampered-jws', sequence: 10, timestamp: 1 }),
        });

        owner.loadPersistedConfig();

        expect(owner.getGate().isKillswitchActive).toBe(false);
        expect(logger.error).toHaveBeenCalledWith(
            'message-system',
            expect.stringContaining('Config authenticity is invalid'),
        );
    });

    it('refuses an acquired config that rolls the sequence back', async () => {
        const store = createTestStore({ configJws: 'persisted-jws', sequence: 10, timestamp: 1 });
        jest.mocked(verifyConfigJws).mockReturnValue(getConfig(10, [getKillswitchAction()]));
        const owner = createOwner({ store });
        owner.loadPersistedConfig();

        jest.mocked(fetchRemoteConfigJws).mockResolvedValue('rolled-back-jws');
        jest.mocked(verifyConfigJws).mockReturnValue(getConfig(9, []));
        await owner.acquireRemoteConfig();

        expect(store.setMessageSystemCache).not.toHaveBeenCalled();
        expect(owner.getGate().isKillswitchActive).toBe(true);
    });

    it('opens the gate again when a newer config drops the killswitch', async () => {
        const store = createTestStore({ configJws: 'persisted-jws', sequence: 10, timestamp: 1 });
        jest.mocked(verifyConfigJws).mockReturnValue(getConfig(10, [getKillswitchAction()]));
        const owner = createOwner({ store });
        const listener = jest.fn();
        owner.loadPersistedConfig();
        owner.subscribe(listener);

        jest.mocked(fetchRemoteConfigJws).mockResolvedValue('newer-jws');
        jest.mocked(verifyConfigJws).mockReturnValue(getConfig(11, []));
        await owner.acquireRemoteConfig();

        expect(store.setMessageSystemCache).toHaveBeenCalledWith({
            configJws: 'newer-jws',
            sequence: 11,
            timestamp: expect.any(Number),
        });
        expect(listener).toHaveBeenCalledWith({
            isKillswitchActive: false,
            killswitchMessageId: undefined,
        });
    });

    it('does not fetch again before the fetch interval elapsed', async () => {
        const owner = createOwner({
            store: createTestStore({
                configJws: 'persisted-jws',
                sequence: 10,
                timestamp: Date.now(),
            }),
        });

        await owner.acquireRemoteConfig();

        expect(fetchRemoteConfigJws).not.toHaveBeenCalled();
    });
});
