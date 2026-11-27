import { type TokenDefinition } from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { buildNFTOptions, filterNFTOptions, withNFTGroupLabel } from './nftOptions';

const PUNKS = '0x00000000000000000000000000000000000000a1';
const GAMES = '0x00000000000000000000000000000000000000a2';
const SCAM_DROP = '0x00000000000000000000000000000000000000a3';
const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';

const punks = mockAccountToken({
    standard: 'ERC721',
    contract: PUNKS,
    name: 'Punks',
    symbol: 'PUNK',
    balance: '2',
    ids: ['7', '1042'],
});
const games = mockAccountToken({
    standard: 'ERC1155',
    contract: GAMES,
    name: 'Game Items',
    symbol: 'GAME',
    multiTokenValues: [
        { id: '3', value: '5' },
        { id: '4', value: '0' },
    ],
});
const scamDrop = mockAccountToken({
    standard: 'ERC721',
    contract: SCAM_DROP,
    name: 'Claim reward',
    balance: '1',
    ids: ['1'],
});
const usdt = mockAccountToken({ contract: USDT, balance: '10' });

const nftDefinitions: TokenDefinition = {
    error: false,
    isLoading: false,
    data: [PUNKS, GAMES],
    hide: [],
    show: [],
};

const getAccount = (symbol: string): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol(symbol),
        tokens: [punks, games, scamDrop, usdt],
    });

const ethAccount = getAccount('eth');

const getItems = (account: Account, isNftSectionEnabled = true) =>
    buildNFTOptions({ account, nftDefinitions, isNftSectionEnabled }).map(({ token, tokenId }) => [
        token.contract,
        tokenId,
    ]);

describe('buildNFTOptions', () => {
    it('lists one option per held item of a known collection', () => {
        expect(getItems(ethAccount)).toEqual([
            [PUNKS, '7'],
            [PUNKS, '1042'],
            [GAMES, '3'],
        ]);
    });

    it('lists nothing when the NFT section is disabled', () => {
        expect(getItems(ethAccount, false)).toEqual([]);
    });

    it('lists nothing on a network without NFTs', () => {
        expect(getItems(getAccount('btc'))).toEqual([]);
    });
});

describe('filterNFTOptions', () => {
    const options = buildNFTOptions({
        account: ethAccount,
        nftDefinitions,
        isNftSectionEnabled: true,
    });
    const filter = (search: string) =>
        filterNFTOptions(options, search).map(({ token, tokenId }) => [token.contract, tokenId]);

    it('keeps everything for an empty search', () => {
        expect(filter('  ')).toHaveLength(3);
    });

    it('matches the collection name regardless of case', () => {
        expect(filter(' GAME items ')).toEqual([[GAMES, '3']]);
    });

    it('matches the item id', () => {
        expect(filter('104')).toEqual([[PUNKS, '1042']]);
    });
});

describe('withNFTGroupLabel', () => {
    it('adds no label without options', () => {
        expect(withNFTGroupLabel([])).toEqual([]);
    });
});
