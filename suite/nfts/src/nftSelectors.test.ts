import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    explorerInitialState,
    getWalletAssetKey,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/device-utils';

import {
    type NftState,
    getNftCollection,
    getNftCollectionCount,
    getNftCollectionExplorerUrl,
    getNftCollectionItems,
    getNftCollectionKeys,
    selectAccountNftHoldings,
    selectNftCollectionExplorer,
    selectWalletNftHoldings,
} from './nftSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const BOB = 'bobWallet@device:1' as StaticSessionId;

const ETH = asNetworkSymbol('eth');
const POL = asNetworkSymbol('pol');
const SEPOLIA = asNetworkSymbol('tsep');

const ITEMS_LIMIT = 50;

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
    multiTokenValues: { id?: string; value: string }[],
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
}: MockStateParams): NftState => {
    const definitions = {
        coin: { data: [USDC_ON_ETH], hide: [], show: [] },
        nft: { data: knownCollections, hide: hiddenCollections, show: [] },
    };

    return {
        device: { selectedDevice: { state: { staticSessionId: ALICE } } },
        wallet: { accounts, settings: { enabledNetworks }, explorer: explorerInitialState },
        tokenDefinitions: { [ETH]: definitions, [POL]: definitions },
    } as unknown as NftState;
};

const punksOnEth = getWalletAssetKey({
    deviceState: ALICE,
    networkSymbol: ETH,
    contractAddress: PUNKS,
});
const apesOnEth = getWalletAssetKey({
    deviceState: ALICE,
    networkSymbol: ETH,
    contractAddress: APES,
});
const scamOnEth = getWalletAssetKey({
    deviceState: ALICE,
    networkSymbol: ETH,
    contractAddress: SCAM_DROP,
});

/** What an open collection of the wallet lists, as the section builds it. */
const collectionItems = (state: NftState, assetKey: WalletAssetKey) => {
    const { shown } = selectWalletNftHoldings(state);

    return getNftCollectionItems(
        shown,
        assetKey,
        ITEMS_LIMIT,
        selectNftCollectionExplorer(state, shown, assetKey),
    );
};

const collectionExplorerUrl = (state: NftState, assetKey: WalletAssetKey) => {
    const { shown } = selectWalletNftHoldings(state);

    return getNftCollectionExplorerUrl(
        shown,
        assetKey,
        selectNftCollectionExplorer(state, shown, assetKey),
    );
};

describe('the collections the section lists', () => {
    it('lists a vouched-for collection with its items', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc721(PUNKS, 'CryptoPunks', ['1492', '4820'])] })],
        });

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([punksOnEth]);
        expect(getNftCollectionKeys(selectWalletNftHoldings(state).hidden)).toEqual([]);
        expect(getNftCollection(selectWalletNftHoldings(state).shown, punksOnEth)?.name).toBe(
            'CryptoPunks',
        );
        expect(collectionItems(state, punksOnEth)).toEqual({
            items: [
                { id: '1492', amount: '1', explorerUrl: expect.any(String) },
                { id: '4820', amount: '1', explorerUrl: expect.any(String) },
            ],
            totalCount: 2,
        });
    });

    it('lists a multi-token item once, with the quantity held as its amount', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc1155(APES, 'Apes', [{ id: '7', value: '3' }])] })],
        });

        expect(collectionItems(state, apesOnEth)).toEqual({
            items: [{ id: '7', amount: '3', explorerUrl: expect.any(String) }],
            totalCount: 1,
        });
    });

    it('counts a multi-token item without an id, as the NFT tab holds it', () => {
        const state = createState({
            accounts: [
                mockAccount({ tokens: [erc1155(APES, 'Apes', [{ id: undefined, value: '3' }])] }),
            ],
        });

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([apesOnEth]);
        expect(getNftCollection(selectWalletNftHoldings(state).shown, apesOnEth)?.itemCount).toBe(
            1,
        );
        expect(collectionItems(state, apesOnEth)).toEqual({
            items: [],
            totalCount: 1,
        });
    });

    it('gathers a collection held by several accounts into one row', () => {
        const state = createState({
            accounts: [
                mockAccount({ index: 0, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
                mockAccount({ index: 1, tokens: [erc721(PUNKS, 'CryptoPunks', ['2'])] }),
            ],
        });

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([punksOnEth]);
        expect(getNftCollection(selectWalletNftHoldings(state).shown, punksOnEth)?.itemCount).toBe(
            2,
        );
    });

    it('counts the balance of a collection the backend lists no items for', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [{ ...erc721(PUNKS, 'CryptoPunks', []), balance: '3' }],
                }),
            ],
        });

        expect(collectionItems(state, punksOnEth)).toEqual({
            items: [],
            totalCount: 0,
        });
        expect(getNftCollection(selectWalletNftHoldings(state).shown, punksOnEth)?.itemCount).toBe(
            3,
        );
    });

    it('counts the balance of an account that lists no items next to one that does', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    index: 0,
                    tokens: [{ ...erc721(PUNKS, 'CryptoPunks', []), balance: '2' }],
                }),
                mockAccount({ index: 1, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] }),
            ],
        });

        expect(getNftCollection(selectWalletNftHoldings(state).shown, punksOnEth)?.itemCount).toBe(
            3,
        );
    });

    it('orders the collections by name', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    tokens: [erc721(PUNKS, 'Punks', ['1']), erc721(APES, 'Apes', ['2'])],
                }),
            ],
        });

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([
            apesOnEth,
            punksOnEth,
        ]);
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

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([punksOnEth]);
        expect(getNftCollectionKeys(selectWalletNftHoldings(state).hidden)).toEqual([
            apesOnEth,
            scamOnEth,
        ]);
        expect(getNftCollection(selectWalletNftHoldings(state).hidden, scamOnEth)?.name).toBe(
            'Claim your reward',
        );
        expect(
            getNftCollection(selectWalletNftHoldings(state).shown, scamOnEth)?.name,
        ).toBeUndefined();
    });

    it('shows what a network without NFT definitions holds, as its NFT tab does', () => {
        const state = createState({
            accounts: [
                mockAccount({
                    symbol: SEPOLIA,
                    tokens: [erc721(SCAM_DROP, 'Claim your reward', ['3'])],
                }),
            ],
            enabledNetworks: [SEPOLIA],
        });

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([
            getWalletAssetKey({
                deviceState: ALICE,
                networkSymbol: SEPOLIA,
                contractAddress: SCAM_DROP,
            }),
        ]);
        expect(getNftCollectionKeys(selectWalletNftHoldings(state).hidden)).toEqual([]);
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

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([]);
        expect(getNftCollectionKeys(selectWalletNftHoldings(state).hidden)).toEqual([]);
    });

    it('leaves out a collection that holds nothing', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc721(PUNKS, 'CryptoPunks', [])] })],
        });

        expect(getNftCollectionKeys(selectWalletNftHoldings(state).shown)).toEqual([]);
        expect(getNftCollectionCount(selectWalletNftHoldings(state).shown)).toBe(0);
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

        expect(getNftCollectionKeys(selectWalletNftHoldings(after).shown)).toBe(
            getNftCollectionKeys(selectWalletNftHoldings(before).shown),
        );
    });

    it('hands back an equal collection when only a balance moves', () => {
        const stateWith = (balance: string) =>
            createState({
                accounts: [mockAccount({ balance, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] })],
            });

        expect(getNftCollection(selectWalletNftHoldings(stateWith('2')).shown, punksOnEth)).toEqual(
            getNftCollection(selectWalletNftHoldings(stateWith('1')).shown, punksOnEth),
        );
    });
});

describe('what an open collection builds', () => {
    it('builds only as many items as are shown and counts the rest', () => {
        const ids = Array.from({ length: 60 }, (_, index) => String(index));
        const state = createState({
            accounts: [mockAccount({ tokens: [erc721(PUNKS, 'CryptoPunks', ids)] })],
        });

        const result = collectionItems(state, punksOnEth);

        expect(result?.items).toHaveLength(ITEMS_LIMIT);
        expect(result?.totalCount).toBe(60);
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

        expect(getNftCollectionCount(selectWalletNftHoldings(state).shown)).toBe(1);
        expect(getNftCollectionCount(selectWalletNftHoldings(state).hidden)).toBe(1);
        expect(getNftCollectionCount(selectWalletNftHoldings(state).shown)).toBe(
            getNftCollectionKeys(selectWalletNftHoldings(state).shown).length,
        );
        expect(getNftCollectionCount(selectWalletNftHoldings(state).hidden)).toBe(
            getNftCollectionKeys(selectWalletNftHoldings(state).hidden).length,
        );
    });
});

describe('where a collection links to', () => {
    it('links each item and the collection to the network explorer', () => {
        const state = createState({
            accounts: [mockAccount({ tokens: [erc721(PUNKS, 'CryptoPunks', ['1492'])] })],
        });

        const [item] = collectionItems(state, punksOnEth)?.items ?? [];

        expect(item?.explorerUrl).toContain(`${PUNKS}/1492`);
        expect(collectionExplorerUrl(state, punksOnEth)).toContain(PUNKS);
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

        expect(
            getNftCollection(selectWalletNftHoldings(state).shown, punksOnEth)?.hasListedItems,
        ).toBe(true);
        expect(
            getNftCollection(selectWalletNftHoldings(state).shown, apesOnEth)?.hasListedItems,
        ).toBe(false);
    });
});

describe('the collections of one account', () => {
    it("lists only that account's collections and counts only its items", () => {
        const first = mockAccount({ index: 0, tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])] });
        const second = mockAccount({
            index: 1,
            tokens: [erc721(PUNKS, 'CryptoPunks', ['2', '3']), erc721(APES, 'Apes', ['4'])],
        });
        const state = createState({ accounts: [first, second] });
        const { shown } = selectAccountNftHoldings(state, first.key);

        expect(getNftCollectionKeys(shown)).toEqual([punksOnEth]);
        expect(getNftCollectionCount(shown)).toBe(1);
        expect(getNftCollection(shown, punksOnEth)?.itemCount).toBe(1);
        expect(
            getNftCollectionItems(
                shown,
                punksOnEth,
                ITEMS_LIMIT,
                selectNftCollectionExplorer(state, shown, punksOnEth),
            ),
        ).toEqual({
            items: [{ id: '1', amount: '1', explorerUrl: expect.any(String) }],
            totalCount: 1,
        });
    });

    it('lists an account asked for by key whatever networks the wallet has enabled', () => {
        const onPolygon = mockAccount({
            symbol: POL,
            tokens: [erc721(PUNKS, 'CryptoPunks', ['1'])],
        });
        const state = createState({ accounts: [onPolygon], enabledNetworks: [ETH] });

        expect(getNftCollectionCount(selectWalletNftHoldings(state).shown)).toBe(0);
        expect(getNftCollectionCount(selectAccountNftHoldings(state, onPolygon.key).shown)).toBe(1);
    });
});
