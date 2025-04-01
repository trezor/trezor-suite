import { CryptoId } from 'invity-api';

import {
    TradingAccountOptionsGroupOptionProps,
    TradingCryptoSelectItemProps,
} from '@suite-common/trading';

import { useDefaultAccountLabel } from 'src/hooks/suite/useDefaultAccountLabel';
import { Account } from 'src/types/wallet';
import {
    FIXTURE_ACCOUNTS,
    FIXTURE_ACCOUNT_OPTIONS,
    coinDefinitions,
} from 'src/utils/wallet/trading/__fixtures__/tradingUtils';
import {
    buildFiatOption,
    getAddressAndTokenFromAccountOptionsGroupProps,
    getCountryLabelParts,
    getTradeTypeByRoute,
    getTradingCryptoInfo,
    tradingBuildAccountOptions,
    tradingGetAccountLabel,
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
    tradingGetSortedAccounts,
} from 'src/utils/wallet/trading/tradingUtils';

jest.mock('src/hooks/suite/useDefaultAccountLabel', () => ({
    ...jest.requireActual('src/hooks/suite/useDefaultAccountLabel'),
    useDefaultAccountLabel: jest.fn(),
}));

describe('trading utils', () => {
    it('buildFiatOption', () => {
        expect(buildFiatOption('czk')).toStrictEqual({ value: 'czk', label: 'CZK' });
    });

    it('getCountryLabelParts', () => {
        expect(getCountryLabelParts('🇨🇿 Czech Republic')).toStrictEqual({
            flag: '🇨🇿',
            text: 'Czech Republic',
        });
        expect(getCountryLabelParts('aaa')).toStrictEqual({
            flag: '',
            text: 'aaa',
        });
    });

    describe('getTradingCryptoInfo', () => {
        it('should return default values for undefined or null input parameters', () => {
            expect(getTradingCryptoInfo(undefined)).toStrictEqual({
                label: undefined,
                networkSymbol: undefined,
                contractAddress: undefined,
            });

            expect(getTradingCryptoInfo(null)).toStrictEqual({
                label: undefined,
                networkSymbol: undefined,
                contractAddress: undefined,
            });
        });

        it('should return correct values for native coin', () => {
            const cryptoSelect: TradingCryptoSelectItemProps = {
                coingeckoId: 'ethereum',
                contractAddress: null,
                cryptoName: 'Ethereum',
                label: 'ETH',
                symbol: 'eth',
                type: 'currency',
                value: 'ethereum' as CryptoId,
            };

            expect(getTradingCryptoInfo(cryptoSelect)).toStrictEqual({
                label: 'ETH',
                networkSymbol: 'eth',
                contractAddress: undefined,
            });
        });

        it('should return correct values for token', () => {
            const cryptoSelect: TradingAccountOptionsGroupOptionProps = {
                accountType: 'normal',
                balance: '5',
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                cryptoName: 'USD Coin',
                decimals: 6,
                descriptor: '0x3338dAad2eA599016E1e59b8B66799228ac76F3b',
                label: 'USDC',
                value: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
            };

            expect(getTradingCryptoInfo(cryptoSelect)).toStrictEqual({
                label: 'USDC',
                networkSymbol: 'eth',
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            });
        });
    });

    it('tradingGetSortedAccounts', () => {
        const sortedAccounts = tradingGetSortedAccounts({
            accounts: FIXTURE_ACCOUNTS as Account[],
            deviceState: '1stTestnetAddress@device_id:0',
        });

        expect(sortedAccounts).toStrictEqual([
            FIXTURE_ACCOUNTS[0],
            FIXTURE_ACCOUNTS[2],
            FIXTURE_ACCOUNTS[5],
            FIXTURE_ACCOUNTS[1],
        ]);
    });

    it('tradingBuildAccountOptions', () => {
        const label = 'mocked label';
        const getDefaultAccountLabel = (useDefaultAccountLabel as jest.Mock).mockImplementation(
            () => label,
        );

        const sortedAccounts = tradingBuildAccountOptions({
            accounts: FIXTURE_ACCOUNTS as Account[],
            deviceState: '1stTestnetAddress@device_id:0',
            accountLabels: {},
            getDefaultAccountLabel,
            tokenDefinitions: { eth: { coin: coinDefinitions } },
            supportedCryptoIds: new Set([
                'bitcoin',
                'litecoin',
                'ethereum',
                'polygon-ecosystem-token',
                'ethereum--0x1234123412341234123412341234123412341236',
            ]) as Set<CryptoId>,
        });

        expect(sortedAccounts).toStrictEqual([
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '0',
                        cryptoName: 'Ethereum',
                        descriptor: 'descriptor3',
                        label: 'ETH',
                        value: 'ethereum',
                        decimals: 18,
                    },
                    {
                        accountType: 'normal',
                        balance: '2230',
                        contractAddress: '0x1234123412341234123412341234123412341236',
                        cryptoName: 'VeChain',
                        descriptor: 'descriptor3',
                        label: 'VEE',
                        value: 'ethereum--0x1234123412341234123412341234123412341236',
                        decimals: 6,
                    },
                ],
            },
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '250',
                        cryptoName: 'Polygon',
                        descriptor: 'descriptor6',
                        label: 'POL',
                        value: 'polygon-ecosystem-token',
                        decimals: 18,
                    },
                ],
            },
            {
                label,
                options: [
                    {
                        accountType: 'normal',
                        balance: '0.101213',
                        cryptoName: 'Litecoin',
                        descriptor: 'descriptor2',
                        label: 'LTC',
                        value: 'litecoin',
                        decimals: 8,
                    },
                ],
            },
        ]);
    });

    it('tradingGetAmountLabels', () => {
        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'sell', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_GET',
            receiveLabel: 'TR_TRADING_YOU_PAY',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: true })).toEqual({
            inputLabel: 'TR_TRADING_YOU_GET',
            offerLabel: 'TR_TRADING_YOU_PAY',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_PAY',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'buy', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_YOU_PAY',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_YOU_PAY',
            receiveLabel: 'TR_TRADING_YOU_GET',
        });

        expect(tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false })).toEqual({
            inputLabel: 'TR_TRADING_SWAP_AMOUNT',
            offerLabel: 'TR_TRADING_YOU_GET',
            labelComparatorOffer: 'TR_TRADING_YOU_WILL_GET',
            sendLabel: 'TR_TRADING_SWAP',
            receiveLabel: 'TR_TRADING_YOU_RECEIVE',
        });
    });

    it('tradingBuildAccountOptions: basic', () => {
        expect(tradingGetRoundedFiatAmount('0.23923')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.24423')).toBe('0.24');
        expect(tradingGetRoundedFiatAmount('0.2')).toBe('0.20');
        expect(tradingGetRoundedFiatAmount(undefined)).toBe('');
        expect(tradingGetRoundedFiatAmount('293SAsdj2')).toBe(''); // NaN
    });

    it('tradingGetAccountLabel', () => {
        expect(tradingGetAccountLabel('BTC', true)).toBe('sat');
        expect(tradingGetAccountLabel('BTC', false)).toBe('BTC');
        expect(tradingGetAccountLabel('USDT', true)).toBe('USDT');
        expect(tradingGetAccountLabel('USDT', false)).toBe('USDT');
    });

    it('getAddressAndTokenFromAccountOptionsGroupProps - testing correct returning value fot setting FormState to send currency', () => {
        FIXTURE_ACCOUNT_OPTIONS.forEach(item => {
            expect(getAddressAndTokenFromAccountOptionsGroupProps(item.option)).toEqual(
                item.result,
            );
        });
    });

    it('getTradeTypeByRoute - testing correct returning trade section according to route', () => {
        expect(getTradeTypeByRoute('wallet-trading-buy')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-detail')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-offers')).toEqual('buy');
        expect(getTradeTypeByRoute('wallet-trading-buy-confirm')).toEqual('buy');

        expect(getTradeTypeByRoute('wallet-trading-sell')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-detail')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-offers')).toEqual('sell');
        expect(getTradeTypeByRoute('wallet-trading-sell-confirm')).toEqual('sell');

        expect(getTradeTypeByRoute('wallet-trading-exchange')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-detail')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-offers')).toEqual('exchange');
        expect(getTradeTypeByRoute('wallet-trading-exchange-confirm')).toEqual('exchange');

        expect(getTradeTypeByRoute('wallet-trading-dca')).toEqual(undefined);
        expect(getTradeTypeByRoute('wallet-index')).toEqual(undefined);
    });
});
