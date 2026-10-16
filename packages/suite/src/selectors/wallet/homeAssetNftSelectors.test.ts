import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type HomeAssetNftState,
    selectHiddenNftCollectionCount,
    selectHiddenNftCollectionKeys,
    selectNftCollection,
    selectNftCollectionItems,
    selectShownNftCollectionCount,
    selectShownNftCollectionKeys,
} from './homeAssetNftSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const POL = asNetworkSymbol('pol');

const PUNKS = '0x00000000000000000000000000000000000000a1' as TokenAddress;
const APES = '0x00000000000000000000000000000000000000a2' as TokenAddress;
const SCAM_DROP = '0x00000000000000000000000000000000000000a3' as TokenAddress;
const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

type MockAccountParams = {
    deviceState?: StaticSessionId;
    symbol?: Account['symbol'];
    index?: number;
    balance?: string;
    isVisible?: boolean;
    tokens?: Partial<TokenInfo>[];
};

const mockAccount = ({
    deviceState = ALICE,
    symbol = ETH,
    index = 0,
    balance = '1',
    isVisible = true,
    tokens = [],
}: MockAccountParams = {}): Account =>
    ({
        key: `descriptor${index}-${symbol}-${deviceState}`,
        deviceState,
        symbol,
        index,
        formattedBalance: balance,
        visible: isVisible,
        tokens,
    }) as unknown as Account;

const erc721 = (contract: TokenAddress, name: string, ids: string[]): Partial<TokenInfo> => ({
    standard: 'ERC721',
    contract,
    name,
    balance: String(ids.length),
    ids,
});

const erc1155 = (
    contract: TokenAddress,
    name: string,
    multiTokenValues: { id: string; value: string }[],
): Partial<TokenInfo> => ({
    standard: 'ERC1155',
    contract,
    name,
    multiTokenValues,
});

type MockStateParams = {
    accounts: Account[];
    enabledNetworks?: Account['symbol'][];
    knownCollections?: TokenAddress[];
    hiddenCollections?: TokenAddress[];
};

const createState = ({
    accounts,
    enabledNetworks = [ETH, POL],
    knownCollections = [PUNKS, APES],
    hiddenCollections = [],
}: MockStateParams): HomeAssetNftState => {
    const definitions = {
        coin: { data: [USDC_ON_ETH], hide: [], show: [] },
        nft: { data: knownCollections, hide: hiddenCollections, show: [] },
    };

    return {
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: { accounts, settings: { enabledNetworks } },
        tokenDefinitions: { [ETH]: definitions, [POL]: definitions },
    } as unknown as HomeAssetNftState;
};

const punksOnEth = getWalletAssetKey({ deviceState: ALICE, symbol: ETH, contractAddress: PUNKS });
const apesOnEth = getWalletAssetKey({ deviceState: ALICE, symbol: ETH, contractAddress: APES });
const scamOnEth = getWalletAssetKey({
    deviceState: ALICE,
    symbol: ETH,
    contractAddress: SCAM_DROP,
});

describe('the collections the section lists', () => {
    it('lists a vouched-for collection with its items', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc721(PUNKS, 'CryptoPunks', ['1492', '4820'])] })],
        });

        expect(selectShownNftCollectionKeys(state)).toEqual([punksOnEth]);
        expect(selectHiddenNftCollectionKeys(state)).toEqual([]);
        expect(selectNftCollection(state, punksOnEth)?.name).toBe('CryptoPunks');
        expect(selectNftCollectionItems(state, punksOnEth)).toEqual([
            { id: '1492', amount: '1' },
            { id: '4820', amount: '1' },
        ]);
    });

    it('counts each item of a multi-token collection as many times as it is held', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc1155(APES, 'Apes', [{ id: '7', value: '3' }])] })],
        });

        expect(selectNftCollectionItems(state, apesOnEth)).toEqual([{ id: '7', amount: '3' }]);
    });

    it('gathers a collection held by several accounts into one row', () => {
        const state = createState({
            accounts: [
                mockAccount({ index: 0, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
                mockAccount({ index: 1, tokens: [erc721(PUNKS, 'CryptoPunks', ['2'])] }),
            ],
        });

        expect(selectShownNftCollectionKeys(state)).toEqual([punksOnEth]);
        expect(selectNftCollection(state, punksOnEth)?.itemCount).toBe(2);
    });

    it('counts the balance of a collection the backend lists no items for', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [{ ...erc721(PUNKS, 'CryptoPunks', []), balance: '3' }],
                }),
            ],
        });

        expect(selectNftCollectionItems(state, punksOnEth)).toEqual([]);
        expect(selectNftCollection(state, punksOnEth)?.itemCount).toBe(3);
    });

    it('orders the collections by name', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [erc721(PUNKS, 'Punks', ['1']), erc721(APES, 'Apes', ['2'])],
                }),
            ],
        });

        expect(selectShownNftCollectionKeys(state)).toEqual([apesOnEth, punksOnEth]);
    });
});

describe('the collections the section hides', () => {
    it('hides what the user hid and what nothing vouches for, readable as hidden', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [
                        erc721(PUNKS, 'CryptoPunks', ['1']),
                        erc721(APES, 'Apes', ['2']),
                        erc721(SCAM_DROP, 'Claim your reward', ['3']),
                    ],
                }),
            ],
            hiddenCollections: [APES],
        });

        expect(selectShownNftCollectionKeys(state)).toEqual([punksOnEth]);
        expect(selectHiddenNftCollectionKeys(state)).toEqual([apesOnEth, scamOnEth]);
        expect(selectNftCollection(state, scamOnEth, true)?.name).toBe('Claim your reward');
        expect(selectNftCollection(state, scamOnEth)?.name).toBeUndefined();
    });
});

describe('what the section leaves out', () => {
    it('leaves out tokens, another wallet, hidden accounts and turned-off networks', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [{ standard: 'ERC20', contract: USDC_ON_ETH, balance: '5' }],
                }),
                mockAccount({ deviceState: BOB, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
                mockAccount({ index: 1, isVisible: false, tokens: [erc721(APES, 'Apes', ['2'])] }),
                mockAccount({ symbol: POL, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
            ],
            enabledNetworks: [ETH],
        });

        expect(selectShownNftCollectionKeys(state)).toEqual([]);
        expect(selectHiddenNftCollectionKeys(state)).toEqual([]);
    });

    it('leaves out a collection that holds nothing', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc721(PUNKS, 'CryptoPunks', [])] })],
        });

        expect(selectShownNftCollectionKeys(state)).toEqual([]);
        expect(selectShownNftCollectionCount(state)).toBe(0);
    });
});

describe('what a write leaves alone', () => {
    it('hands back the same keys when only a balance moves', () => {
        const before = createState({
            accounts: [
                mockAccount({ balance: '1', tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
            ],
        });
        const after = createState({
            accounts: [
                mockAccount({ balance: '2', tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
            ],
        });

        expect(selectShownNftCollectionKeys(after)).toBe(selectShownNftCollectionKeys(before));
    });
});

describe('what the collapsed section counts', () => {
    it('counts each collection once, apart from where it is held, as the lists do', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    index: 0,
                    tokens: [
                        erc721(PUNKS, 'CryptoPunks', ['1']),
                        erc721(SCAM_DROP, 'Claim your reward', ['3']),
                    ],
                }),
                mockAccount({ index: 1, tokens: [erc721(PUNKS, 'CryptoPunks', ['2'])] }),
                mockAccount({ symbol: POL, tokens: [erc721(APES, 'Apes', ['4'])] }),
            ],
            enabledNetworks: [ETH],
        });

        expect(selectShownNftCollectionCount(state)).toBe(1);
        expect(selectHiddenNftCollectionCount(state)).toBe(1);
        expect(selectShownNftCollectionCount(state)).toBe(
            selectShownNftCollectionKeys(state).length,
        );
        expect(selectHiddenNftCollectionCount(state)).toBe(
            selectHiddenNftCollectionKeys(state).length,
        );
    });
});

describe('what a row can open', () => {
    it('opens only a collection whose items the backend lists', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [
                        erc721(PUNKS, 'CryptoPunks', ['1']),
                        { ...erc721(APES, 'Apes', []), balance: '2' },
                    ],
                }),
            ],
        });

        expect(selectNftCollection(state, punksOnEth)?.hasListedItems).toBe(true);
        expect(selectNftCollection(state, apesOnEth)?.hasListedItems).toBe(false);
    });
});
