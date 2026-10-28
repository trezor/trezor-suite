import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccountsRootState,
    type WalletAssetKey,
    getWalletAssetKey,
} from '@suite-common/wallet-core';
import { type Account, asAccountDescriptor, toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { selectAssetSendTargets } from './selectAssetSendTargets';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');
const deviceState = '1stTestnetAddress@device_id:0';
const usdcAddress = toTokenAddress(`0x${'a'.repeat(40)}`);

const ethKey: WalletAssetKey = getWalletAssetKey({ deviceState, symbol: ethSymbol });
const usdcKey: WalletAssetKey = getWalletAssetKey({
    deviceState,
    symbol: ethSymbol,
    contractAddress: usdcAddress,
});

const buildState = (accounts: Account[]): AssetAccountsRootState => ({
    wallet: { accounts },
    device: {
        devices: [],
        buttonRequestsByPath: {},
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: deviceState } }),
    },
    tokenDefinitions: {},
});

const ethAccount = (index: number, account: Partial<Account> = {}) =>
    mockWalletAccount({
        symbol: ethSymbol,
        index,
        descriptor: asAccountDescriptor(`eth${index}`),
        balance: '1',
        formattedBalance: '1',
        ...account,
    });

describe('selectAssetSendTargets', () => {
    it('targets the visible accounts with a spendable balance of the coin', () => {
        const funded = ethAccount(0);
        const empty = ethAccount(1, { balance: '0', formattedBalance: '0' });
        const hidden = ethAccount(2, { visible: false });
        const otherNetwork = mockWalletAccount({ symbol: btcSymbol, balance: '1' });

        expect(
            selectAssetSendTargets(buildState([funded, empty, hidden, otherNetwork]), ethKey),
        ).toEqual([{ account: funded, contractAddress: undefined }]);
    });

    it('targets the accounts holding the token with its contract', () => {
        const holding = ethAccount(0, {
            tokens: [mockAccountToken({ contract: usdcAddress, balance: '5' })],
        });
        const zeroBalance = ethAccount(1, {
            tokens: [mockAccountToken({ contract: usdcAddress, balance: '0' })],
        });
        const notHolding = ethAccount(2);

        expect(
            selectAssetSendTargets(buildState([holding, zeroBalance, notHolding]), usdcKey),
        ).toEqual([{ account: holding, contractAddress: usdcAddress }]);
    });

    it('returns nothing without a selected device', () => {
        const state: AssetAccountsRootState = {
            ...buildState([ethAccount(0)]),
            device: { devices: [], buttonRequestsByPath: {} },
        };

        expect(selectAssetSendTargets(state, ethKey)).toEqual([]);
    });
});
