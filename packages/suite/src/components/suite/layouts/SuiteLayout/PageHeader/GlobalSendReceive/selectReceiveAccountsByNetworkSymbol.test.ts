import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type ReceiveAccountsByNetworkSymbolState,
    selectReceiveAccountsByNetworkSymbol,
} from './selectReceiveAccountsByNetworkSymbol';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');
const deviceState = '1stTestnetAddress@device_id:0';

const buildState = (accounts: Account[]): ReceiveAccountsByNetworkSymbolState => ({
    wallet: { accounts },
    device: {
        devices: [],
        buttonRequestsByPath: {},
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: deviceState } }),
    },
    networks: mockNetworksState([btcSymbol, ethSymbol]),
    debug: { showDebugMenu: false },
});

const account = (symbol: NetworkSymbol, index: number, overrides: Partial<Account> = {}) =>
    mockWalletAccount({
        symbol,
        index,
        descriptor: asAccountDescriptor(`${symbol}${index}`),
        ...overrides,
    });

describe('selectReceiveAccountsByNetworkSymbol', () => {
    it('lists the receivable accounts on the network', () => {
        const first = account(ethSymbol, 0);
        const second = account(ethSymbol, 1);
        const otherNetwork = account(btcSymbol, 0);
        const state = buildState([first, second, otherNetwork]);

        expect(selectReceiveAccountsByNetworkSymbol(state, ethSymbol)).toEqual([first, second]);
        expect(selectReceiveAccountsByNetworkSymbol(state, undefined)).toEqual([]);
    });

    it('skips coinjoin accounts and accounts of another device', () => {
        const normal = account(btcSymbol, 0);
        const coinjoin = account(btcSymbol, 1, { accountType: 'coinjoin' });
        const otherDevice = account(btcSymbol, 2, {
            deviceState: 'otherAddress@other_device:0',
        });

        expect(
            selectReceiveAccountsByNetworkSymbol(
                buildState([normal, coinjoin, otherDevice]),
                btcSymbol,
            ),
        ).toEqual([normal]);
    });

    it('returns nothing without a selected device', () => {
        const state: ReceiveAccountsByNetworkSymbolState = {
            ...buildState([account(ethSymbol, 0)]),
            device: { devices: [], buttonRequestsByPath: {} },
        };

        expect(selectReceiveAccountsByNetworkSymbol(state, ethSymbol)).toEqual([]);
    });
});
