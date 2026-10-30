import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type AssetDetailState,
    selectWalletAssetAccountKeys,
    selectWalletAssetCandidateAccountKeys,
} from './assetDetailSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const BTC = asNetworkSymbol('btc');
const ETH = asNetworkSymbol('eth');

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const SPAM_TOKEN = '0x0000000000000000000000000000000000000bad' as TokenAddress;

type MockAccountParams = {
    deviceState?: StaticSessionId;
    symbol?: NetworkSymbol;
    index?: number;
    isVisible?: boolean;
    isFailed?: boolean;
    tokens?: { contract: TokenAddress; balance: string }[];
};

const mockAccount = ({
    deviceState = ALICE,
    symbol = ETH,
    index = 0,
    isVisible = true,
    isFailed = false,
    tokens = [],
}: MockAccountParams = {}): Account =>
    ({
        key: `descriptor${index}-${symbol}-${deviceState}`,
        descriptor: `descriptor${index}`,
        deviceState,
        symbol,
        index,
        visible: isVisible,
        ...(isFailed ? { failed: true, error: 'backend down' } : {}),
        tokens,
    }) as unknown as Account;

type MockTokenTransferParams = {
    txid: string;
    contract: TokenAddress;
    amount: string;
};

const mockTokenTransfer = ({ txid, contract, amount }: MockTokenTransferParams) =>
    ({
        txid,
        symbol: ETH,
        type: 'recv',
        amount: '0',
        fee: '0',
        blockHeight: 100,
        blockTime: 1700000000,
        targets: [],
        internalTransfers: [],
        tokens: [{ contract, amount, type: 'recv', standard: 'ERC20', decimals: 6 }],
    }) as unknown as WalletAccountTransaction;

type CreateStateParams = {
    accounts: Account[];
    transactions?: Record<string, WalletAccountTransaction[]>;
    txsMarkedAsNotScam?: Record<string, string[]>;
};

const createState = ({
    accounts,
    transactions = {},
    txsMarkedAsNotScam = {},
}: CreateStateParams): AssetDetailState =>
    ({
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: {
            accounts,
            transactions: { transactions, phishing: txsMarkedAsNotScam, fetchStatusDetail: {} },
            fiat: { current: {}, lastWeek: {}, historic: {} },
            phishing: { dustPhishing: { isEnabled: false, dustThreshold: '0' } },
        },
        tokenDefinitions: { [ETH]: { coin: { data: [USDC], hide: [], show: [] } } },
    }) as unknown as AssetDetailState;

describe('selectWalletAssetAccountKeys', () => {
    it('takes every visible account of the network on the selected device for a coin', () => {
        const emptyEthereum = mockAccount({ index: 1 });
        const state = createState({
            accounts: [
                mockAccount(),
                emptyEthereum,
                mockAccount({ index: 2, isVisible: false }),
                mockAccount({ symbol: BTC }),
                mockAccount({ deviceState: BOB }),
            ],
        });

        expect(selectWalletAssetAccountKeys(state, ETH)).toEqual([
            mockAccount().key,
            emptyEthereum.key,
        ]);
    });

    it('takes the accounts holding a token', () => {
        const holder = mockAccount({ tokens: [{ contract: USDC, balance: '1' }] });
        const state = createState({ accounts: [holder, mockAccount({ index: 1 })] });

        expect(selectWalletAssetAccountKeys(state, ETH, USDC)).toEqual([holder.key]);
    });

    it('takes an emptied token account once it has a loaded transfer of the token that is not phishing', () => {
        const emptied = mockAccount({ tokens: [{ contract: USDC, balance: '0' }] });
        const withoutTransfers = mockAccount({
            index: 1,
            tokens: [{ contract: USDC, balance: '0' }],
        });
        const state = createState({
            accounts: [emptied, withoutTransfers],
            transactions: {
                [emptied.key]: [mockTokenTransfer({ txid: 'a', contract: USDC, amount: '5' })],
            },
        });

        expect(selectWalletAssetAccountKeys(state, ETH, USDC)).toEqual([emptied.key]);
    });

    it('leaves out an emptied token account whose only transfers are phishing', () => {
        const spammed = mockAccount({ tokens: [{ contract: SPAM_TOKEN, balance: '0' }] });
        const state = createState({
            accounts: [spammed],
            transactions: {
                [spammed.key]: [
                    mockTokenTransfer({ txid: 'zero', contract: SPAM_TOKEN, amount: '0' }),
                    mockTokenTransfer({ txid: 'fake', contract: SPAM_TOKEN, amount: '1' }),
                ],
            },
        });

        expect(selectWalletAssetAccountKeys(state, ETH, SPAM_TOKEN)).toEqual([]);
    });

    it('takes a phishing transfer the user marked as not a scam', () => {
        const spammed = mockAccount({ tokens: [{ contract: SPAM_TOKEN, balance: '0' }] });
        const state = createState({
            accounts: [spammed],
            transactions: {
                [spammed.key]: [
                    mockTokenTransfer({ txid: 'fake', contract: SPAM_TOKEN, amount: '1' }),
                ],
            },
            txsMarkedAsNotScam: { [spammed.key]: ['fake'] },
        });

        expect(selectWalletAssetAccountKeys(state, ETH, SPAM_TOKEN)).toEqual([spammed.key]);
    });

    it('hands back the same keys while the asset accounts stay the same', () => {
        const accounts = [mockAccount(), mockAccount({ index: 1 })];

        expect(selectWalletAssetAccountKeys(createState({ accounts }), ETH)).toBe(
            selectWalletAssetAccountKeys(createState({ accounts: [...accounts] }), ETH),
        );
    });
});

describe('selectWalletAssetCandidateAccountKeys', () => {
    it('takes every account listing the token, whatever its balance or transfers', () => {
        const holder = mockAccount({ tokens: [{ contract: USDC, balance: '1' }] });
        const emptied = mockAccount({ index: 1, tokens: [{ contract: USDC, balance: '0' }] });
        const state = createState({ accounts: [holder, emptied, mockAccount({ index: 2 })] });

        expect(selectWalletAssetCandidateAccountKeys(state, ETH, USDC)).toEqual([
            holder.key,
            emptied.key,
        ]);
    });

    it('leaves out an account that failed to load', () => {
        const state = createState({
            accounts: [mockAccount(), mockAccount({ index: 1, isFailed: true })],
        });

        expect(selectWalletAssetCandidateAccountKeys(state, ETH)).toEqual([mockAccount().key]);
    });
});
