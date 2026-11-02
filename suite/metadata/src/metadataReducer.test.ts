import { suiteSettingsInitialState } from '@suite/settings';
import { deviceInitialState } from '@suite-common/device';
import { type MetadataProvider } from '@suite-common/metadata-types';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import { ENCRYPTION_VERSION } from './metadataLabelingConstants';
import {
    type MetadataRootState,
    initialMetadataState,
    selectIsLabelingAvailableForEntity,
} from './metadataReducer';

const WALLET: StaticSessionId = 'walletAddress@device_id:0';
const OTHER_WALLET: StaticSessionId = 'otherWalletAddress@device_id:1';

const provider: MetadataProvider = {
    type: 'inMemoryTest',
    user: 'user',
    tokens: {},
    isCloud: false,
    data: {},
    clientId: 'clientId',
};

const mockWallet = (
    staticSessionId: StaticSessionId,
    metadata: TrezorDevice['metadata'] = {
        [ENCRYPTION_VERSION]: {
            fileName: `${staticSessionId}-file`,
            aesKey: 'aesKey',
            key: 'key',
        },
    },
): TrezorDevice => mockSuiteDevice({ state: { staticSessionId }, metadata });

const mockLabelableAccount = (deviceState: StaticSessionId, fileName?: string): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('btc'),
        deviceState,
        metadata: {
            key: 'xpub',
            ...(fileName ? { [ENCRYPTION_VERSION]: { fileName, aesKey: 'aesKey' } } : {}),
        },
    });

const mockState = ({
    accounts,
    devices,
    isEnabled = true,
}: {
    accounts: Account[];
    devices?: TrezorDevice[];
    isEnabled?: boolean;
}): MetadataRootState => {
    const wallet = mockWallet(WALLET);

    return {
        metadata: {
            ...initialMetadataState,
            enabled: isEnabled,
            providers: [provider],
            selectedProvider: { labels: provider.clientId, passwords: '' },
        },
        wallet: { accounts },
        device: {
            ...deviceInitialState,
            devices: devices ?? [wallet, mockWallet(OTHER_WALLET)],
            selectedDevice: wallet,
        },
        suiteSettings: suiteSettingsInitialState,
        suite: { online: true },
    };
};

describe(selectIsLabelingAvailableForEntity.name, () => {
    it('is available for an account of the selected wallet', () => {
        const account = mockLabelableAccount(WALLET, 'accountFile');
        const state = mockState({ accounts: [account] });

        expect(selectIsLabelingAvailableForEntity(state, account.key)).toBe(true);
    });

    it('is not available for an account without a metadata file', () => {
        const account = mockLabelableAccount(WALLET);
        const state = mockState({ accounts: [account] });

        expect(selectIsLabelingAvailableForEntity(state, account.key)).toBe(false);
    });

    it('is not available for an account of another wallet', () => {
        const account = mockLabelableAccount(OTHER_WALLET, 'accountFile');
        const state = mockState({ accounts: [account] });

        expect(selectIsLabelingAvailableForEntity(state, account.key)).toBe(false);
    });

    it('resolves the wallet from the given static session id', () => {
        const account = mockLabelableAccount(OTHER_WALLET, 'accountFile');
        const state = mockState({ accounts: [account] });

        expect(selectIsLabelingAvailableForEntity(state, account.key, OTHER_WALLET)).toBe(true);
    });

    it('is available for the wallet itself', () => {
        const state = mockState({ accounts: [] });

        expect(selectIsLabelingAvailableForEntity(state, WALLET, WALLET)).toBe(true);
    });

    it('is not available for another wallet than the resolved one', () => {
        const state = mockState({ accounts: [] });

        expect(selectIsLabelingAvailableForEntity(state, OTHER_WALLET, WALLET)).toBe(false);
    });

    it('is not available for a wallet without metadata keys', () => {
        const state = mockState({
            accounts: [],
            devices: [mockWallet(WALLET), mockWallet(OTHER_WALLET, {})],
        });

        expect(selectIsLabelingAvailableForEntity(state, OTHER_WALLET, OTHER_WALLET)).toBe(false);
    });

    it('reads the wallet keys from the device list, not the selected device copy', () => {
        const state = mockState({ accounts: [], devices: [mockWallet(WALLET, {})] });

        expect(selectIsLabelingAvailableForEntity(state, WALLET)).toBe(false);
    });

    it('is not available for an unknown entity', () => {
        const state = mockState({ accounts: [mockLabelableAccount(WALLET, 'accountFile')] });

        expect(selectIsLabelingAvailableForEntity(state, 'unknown')).toBe(false);
    });

    it('is not available when legacy labeling is disabled', () => {
        const account = mockLabelableAccount(WALLET, 'accountFile');
        const state = mockState({ accounts: [account], isEnabled: false });

        expect(selectIsLabelingAvailableForEntity(state, account.key)).toBe(false);
    });
});
