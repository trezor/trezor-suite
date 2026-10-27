import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type AccountInfo, type StaticSessionId } from '@trezor/connect';
import type { Bip43Path } from '@trezor/crypto-utils';

import {
    getDiscoveryOutcome,
    getErrorCode,
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
