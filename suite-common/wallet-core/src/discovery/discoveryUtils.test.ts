import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type AccountInfo, type StaticSessionId } from '@trezor/connect';
import type { Bip43Path } from '@trezor/crypto-utils';

import {
    findDuplicateWallet,
    getDiscoveryOutcome,
    getErrorCode,
    getReportableErrorCode,
    shouldFetchAssetsAfterDiscovery,
} from './discoveryUtils';
import { type CreateAccountActionProps } from '../accounts/accountsActions';

const accountInfo = (empty: boolean): AccountInfo => ({
    descriptor: '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF',
    balance: '0',
    availableBalance: '0',
    empty,
    history: { total: -1, unconfirmed: 0 },
});

const discovered: CreateAccountActionProps = {
    deviceState: '1stTestnetAddress@device_id:0' as StaticSessionId,
    symbol: asNetworkSymbol('eth'),
    index: 0,
    accountType: 'normal',
    path: "m/44'/60'/0'/0/0" as Bip43Path,
    backendType: 'evm-rpc',
    accountInfo: accountInfo(false),
    visible: true,
    failed: undefined,
};

describe(getDiscoveryOutcome.name, () => {
    it.each<DiscoveryStatus>([
        { status: 'complete' },
        { status: 'failed', error: 'backend down', errorCode: 'Backend_Error' },
        { status: 'cancelled' },
        { status: 'passphrase-mismatch' },
        { status: 'passphrase-duplicate', duplicateDeviceStaticSessionId: 'a@b:1' },
    ])('returns the status of a run that ended as $status', discovery => {
        expect(getDiscoveryOutcome(discovery)).toBe(discovery.status);
    });

    it.each<DiscoveryStatus>([
        { status: 'starting' },
        { status: 'enter-passphrase' },
        { status: 'progress', total: 10, progress: 5 },
        { status: 'confirm-empty-passphrase' },
    ])('returns undefined while a run is still $status', discovery => {
        expect(getDiscoveryOutcome(discovery)).toBeUndefined();
    });

    it('returns undefined when there is no run', () => {
        expect(getDiscoveryOutcome(undefined)).toBeUndefined();
    });
});

describe(getErrorCode.name, () => {
    it('reads the code of a Connect-style error', () => {
        expect(getErrorCode({ code: 'Device_Disconnected', message: 'gone' })).toBe(
            'Device_Disconnected',
        );
    });

    it.each([new Error('assertion error'), 'plain string', undefined, { code: 42 }])(
        'falls back to the unknown code for %p',
        error => {
            expect(getErrorCode(error)).toBe('Failure_UnknownCode');
        },
    );
});

describe(getReportableErrorCode.name, () => {
    it.each([
        'Device_Disconnected',
        'Backend_Error',
        'Failure_ActionCancelled',
        'Failure_PinInvalid',
        'ThpDeviceLocked',
        'ThpTransportBusy',
    ])('keeps the known Trezor Connect, firmware or THP code %s', code => {
        expect(getReportableErrorCode(code)).toBe(code);
    });

    it.each([
        'ECONNRESET',
        'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
        '4',
        undefined,
    ])('reports %p as the unknown code', code => {
        expect(getReportableErrorCode(code)).toBe('Failure_UnknownCode');
    });
});

describe(shouldFetchAssetsAfterDiscovery.name, () => {
    it('asks for assets of a used account found over direct rpc', () => {
        expect(shouldFetchAssetsAfterDiscovery(discovered)).toBe(true);
    });

    it('skips an empty account', () => {
        expect(
            shouldFetchAssetsAfterDiscovery({ ...discovered, accountInfo: accountInfo(true) }),
        ).toBe(false);
    });

    it('skips a failed account', () => {
        expect(
            shouldFetchAssetsAfterDiscovery({ ...discovered, failed: true, error: 'backend down' }),
        ).toBe(false);
    });

    it('skips blockbook-backed accounts, which arrive with their tokens', () => {
        expect(shouldFetchAssetsAfterDiscovery({ ...discovered, backendType: 'blockbook' })).toBe(
            false,
        );
        expect(shouldFetchAssetsAfterDiscovery({ ...discovered, backendType: undefined })).toBe(
            false,
        );
    });
});

describe(findDuplicateWallet.name, () => {
    const authorizing = mockSuiteDevice({ id: 'device_id' });

    it('finds another instance of the same wallet held by the device', () => {
        const held = mockSuiteDevice({
            id: 'device_id',
            state: { staticSessionId: '1stTestnetAddress@device_id:1' },
        });

        expect(
            findDuplicateWallet([held, authorizing], authorizing, {
                staticSessionId: '1stTestnetAddress@device_id:2',
            }),
        ).toEqual(held.state);
    });

    it('misses a wallet still keyed by the device_id it was authorized with before the reset', () => {
        const reprovisioned = mockSuiteDevice({ id: 'fresh_device_id' });
        // The entry was attached while the device was wiped and recovered, so the reducer re-keyed
        // it to the fresh `device_id` while its static session id kept the pre-reset one.
        const held = mockSuiteDevice({
            id: 'fresh_device_id',
            state: { staticSessionId: '1stTestnetAddress@device_id:1' },
        });

        // Documents #31883 in the duplicate guard: the comparison keeps the `deviceId`, so the
        // wallet Suite already holds is not recognized and authorizing it adds a second entry for
        // the same wallet. Flips in the following commit.
        expect(
            findDuplicateWallet([held, reprovisioned], reprovisioned, {
                staticSessionId: '1stTestnetAddress@fresh_device_id:1',
            }),
        ).toBeUndefined();
    });

    it('keeps the wallets of a second device recovered from the same seed apart', () => {
        const otherDevice = mockSuiteDevice({
            id: 'other_device_id',
            state: { staticSessionId: '1stTestnetAddress@other_device_id:1' },
        });

        expect(
            findDuplicateWallet([otherDevice, authorizing], authorizing, {
                staticSessionId: '1stTestnetAddress@device_id:1',
            }),
        ).toBeUndefined();
    });

    it('misses an instance that was already detached when the device_id changed', () => {
        const reprovisioned = mockSuiteDevice({ id: 'fresh_device_id' });
        // A remembered instance keeps the pre-reset `id` forever: the reducer re-keys only
        // connected or path-matched entries. This records the known limitation of the filter.
        const detached = mockSuiteDevice({
            id: 'device_id',
            remember: true,
            connected: false,
            path: '',
            state: { staticSessionId: '1stTestnetAddress@device_id:1' },
        });

        expect(
            findDuplicateWallet([detached, reprovisioned], reprovisioned, {
                staticSessionId: '1stTestnetAddress@fresh_device_id:1',
            }),
        ).toBeUndefined();
    });

    it('ignores a persisted device state that is not a static session id', () => {
        const legacy = mockSuiteDevice({
            id: 'device_id',
            state: { staticSessionId: 'legacy-device-state' as StaticSessionId },
        });

        expect(
            findDuplicateWallet([legacy, authorizing], authorizing, {
                staticSessionId: '1stTestnetAddress@device_id:1',
            }),
        ).toBeUndefined();
    });
});
