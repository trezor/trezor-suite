import type { CryptoId } from 'invity-api';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { type SectionListData } from '@suite-native/trading-atoms';
import {
    btcAsset,
    ethAsset,
    getBtcAccount,
    getEthAccount,
    usdcAsset,
    usdtAsset,
} from '@suite-native/trading-fixtures';
import { type MyAsset } from '@suite-native/trading-types';

import { findOwnedAssetByCryptoIds, findTradeableAssetByCryptoIds } from './defaultAssetUtils';

const BITCOIN = 'bitcoin' as CryptoId;
const ETHEREUM = 'ethereum' as CryptoId;
const USDT = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

const createMyAsset = (cryptoId: CryptoId, isEnabled = true): MyAsset => ({
    symbol: asNetworkSymbol(cryptoId === BITCOIN ? 'btc' : 'eth'),
    name: cryptoId,
    balance: '1',
    fiatBalance: null,
    cryptoId,
    isEnabled,
});

const createSection = (account: Account, data: MyAsset[]) => ({
    key: `section_${account.key}`,
    label: account.accountLabel ?? '',
    sectionData: account,
    data,
});

describe('defaultAssetUtils', () => {
    describe('findTradeableAssetByCryptoIds', () => {
        it('should return the first candidate available in the assets', () => {
            expect(findTradeableAssetByCryptoIds([ethAsset, btcAsset], [BITCOIN, ETHEREUM])).toBe(
                btcAsset,
            );
        });

        it('should fall back to a next candidate', () => {
            expect(findTradeableAssetByCryptoIds([ethAsset], [BITCOIN, ETHEREUM])).toBe(ethAsset);
        });

        it('should return undefined when no candidate is available', () => {
            expect(
                findTradeableAssetByCryptoIds([usdcAsset, usdtAsset], [BITCOIN]),
            ).toBeUndefined();
        });
    });

    describe('findOwnedAssetByCryptoIds', () => {
        const btcAccount = getBtcAccount();
        const ethAccount = getEthAccount();

        it('should prefer candidate order over account order', () => {
            const myAssets: SectionListData<MyAsset, Account> = [
                createSection(ethAccount, [createMyAsset(ETHEREUM)]),
                createSection(btcAccount, [createMyAsset(BITCOIN)]),
            ];

            expect(findOwnedAssetByCryptoIds(myAssets, [BITCOIN, ETHEREUM])).toEqual({
                cryptoId: BITCOIN,
                account: btcAccount,
            });
        });

        it('should fall back to a next candidate the user holds', () => {
            const myAssets: SectionListData<MyAsset, Account> = [
                createSection(ethAccount, [createMyAsset(ETHEREUM)]),
            ];

            expect(findOwnedAssetByCryptoIds(myAssets, [BITCOIN, ETHEREUM])).toEqual({
                cryptoId: ETHEREUM,
                account: ethAccount,
            });
        });

        it('should match a token held in an account', () => {
            const myAssets: SectionListData<MyAsset, Account> = [
                createSection(ethAccount, [createMyAsset(ETHEREUM), createMyAsset(USDT)]),
            ];

            expect(findOwnedAssetByCryptoIds(myAssets, [USDT])).toEqual({
                cryptoId: USDT,
                account: ethAccount,
            });
        });

        it('should skip assets that cannot be traded', () => {
            const myAssets: SectionListData<MyAsset, Account> = [
                createSection(ethAccount, [createMyAsset(USDT, false)]),
            ];

            expect(findOwnedAssetByCryptoIds(myAssets, [USDT])).toBeUndefined();
        });

        it('should return undefined when the user holds no candidate', () => {
            const myAssets: SectionListData<MyAsset, Account> = [
                createSection(ethAccount, [createMyAsset(ETHEREUM)]),
            ];

            expect(findOwnedAssetByCryptoIds(myAssets, [USDT])).toBeUndefined();
        });
    });
});
