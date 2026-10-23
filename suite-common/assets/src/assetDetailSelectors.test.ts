import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import { selectWalletAssetAccounts } from './assetDetailSelectors';
import { type HomeAssetTableState } from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const DAI_ON_ETH = '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress;

type MockAccountParams = {
    symbol: Account['symbol'];
    index: number;
    balance?: string;
    tokens?: { contract: TokenAddress; balance: string }[];
};

const mockAccount = ({ symbol, index, balance = '1', tokens = [] }: MockAccountParams): Account =>
    ({
        key: `descriptor${index}-${symbol}-${ALICE}`,
        descriptor: `descriptor${index}`,
        deviceState: ALICE,
        symbol,
        index,
        accountType: 'normal',
        formattedBalance: balance,
        visible: true,
        tokens: tokens.map(token => ({ ...token, standard: 'ERC20', symbol: 'tkn' })),
    }) as unknown as Account;

type MockStateParams = {
    accounts: Account[];
};

const createState = ({ accounts }: MockStateParams): HomeAssetTableState =>
    ({
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            settings: {
                enabledNetworks: [BTC, ETH],
                localCurrency: 'usd',
                areHomeAssetSmallBalancesShown: true,
            },
            fiat: { current: {}, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: {
            [ETH]: { coin: { data: [USDC_ON_ETH, DAI_ON_ETH], hide: [], show: [] } },
        },
        networks: {},
    }) as unknown as HomeAssetTableState;

const bitcoin = getWalletAssetKey({ deviceState: ALICE, symbol: BTC, contractAddress: undefined });

describe('the accounts the asset is on', () => {
    const state = createState({
        accounts: [
            mockAccount({ symbol: BTC, index: 0, balance: '0.5' }),
            mockAccount({ symbol: BTC, index: 1, balance: '0' }),
            mockAccount({ symbol: ETH, index: 2 }),
        ],
    });

    it('lists every account of the coin, the empty ones too, since they keep a history', () => {
        expect(selectWalletAssetAccounts(state, bitcoin).map(({ key }) => key)).toEqual([
            `descriptor0-btc-${ALICE}`,
            `descriptor1-btc-${ALICE}`,
        ]);
    });

    it('hands the same accounts back while they do not change', () => {
        expect(selectWalletAssetAccounts(state, bitcoin)).toBe(
            selectWalletAssetAccounts(state, bitcoin),
        );
    });
});
