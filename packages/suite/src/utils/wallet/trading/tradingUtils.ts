import { BuyTrade, ExchangeTrade, SellFiatTrade } from 'invity-api';

import { ExtendedMessageDescriptor } from '@suite/intl';
import { type TradingType } from '@suite-common/trading';
import { Network, NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { PrecomposedLevels, PrecomposedLevelsCardano } from '@suite-common/wallet-types';
import { asAmountSubunit, substituteBip43Path, subunitsToUnits } from '@suite-common/wallet-utils';
import TrezorConnect, { FeeLevel, TokenInfo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { Route, TrezorDevice } from 'src/types/suite';
import {
    TradingGetAmountLabelsProps,
    TradingGetAmountLabelsReturnProps,
    TradingGetProvidersInfoProps,
} from 'src/types/trading/trading';
import { Account } from 'src/types/wallet';

export const translationKeys: Record<
    TradingType,
    Extract<ExtendedMessageDescriptor['id'], 'TR_BUY' | 'TR_TRADING_SELL' | 'TR_TRADING_SWAP'>
> = {
    buy: 'TR_BUY',
    sell: 'TR_TRADING_SELL',
    exchange: 'TR_TRADING_SWAP',
};

export const getCountryLabelParts = (label: string) => {
    try {
        const parts = label.split(' ');
        if (parts.length === 1) {
            return {
                flag: '',
                text: label,
            };
        }
        const flag = parts[0];
        parts.shift();
        const text = parts.join(' ');

        return { flag, text };
    } catch {
        return null;
    }
};

export const getComposeAddressPlaceholder = async (
    account: Account,
    network: Network,
    device?: TrezorDevice,
    accounts?: Account[],
    chunkify?: boolean,
) => {
    // the address is later replaced by the address of the sell
    // as a precaution, use user's own address as a placeholder
    const { networkType } = account;
    switch (networkType) {
        case 'bitcoin': {
            // use legacy (the most expensive) address for fee calculation
            // as we do not know what address type the exchange will use
            const availableAccounts = network.accountTypes;
            const bip43Path =
                availableAccounts['legacy']?.bip43Path ??
                availableAccounts['segwit']?.bip43Path ??
                network.bip43Path;

            if (device) {
                // try to get the already discovered legacy account
                const legacyPath = substituteBip43Path(bip43Path);
                const legacyAccount = accounts?.find(a => a.path === legacyPath);
                if (legacyAccount?.addresses?.unused[0]) {
                    return legacyAccount?.addresses?.unused[0].address;
                }
                // if it is not discovered, get an address from trezor
                const result = await TrezorConnect.getAddress({
                    device,
                    coin: account.symbol,
                    path: `${substituteBip43Path(bip43Path)}/0/0`,
                    showOnTrezor: false,
                    chunkify,
                });
                if (result.success) {
                    return result.payload.address;
                }
            }

            // as a fallback, use the change address of current account
            return account.addresses?.change[0].address;
        }
        case 'ethereum':
            // ethereum address is not used as it breaks calculating fee logic;
            return '';
        case 'cardano':
            // it is not possible to use change address of the current account as the placeholder, some exchanges use Byron addresses
            // which need more fees than Shelley addresses used in the Suite, using dummy Byron address for the placeholder
            // return '37btjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na';
            return '';
        case 'solana':
        case 'ripple':
        case 'stellar':
            return account.descriptor;
        // no default
    }
};

export const tradingGetAmountLabels = ({
    type,
    amountInCrypto,
}: TradingGetAmountLabelsProps): TradingGetAmountLabelsReturnProps => {
    const youGet = 'TR_TRADING_YOU_GET';
    const youPay = 'TR_TRADING_YOU_PAY';
    const youWillGet = 'TR_TRADING_YOU_WILL_GET';
    const youWillPay = 'TR_TRADING_YOU_WILL_PAY';
    const exchangeAmount = 'TR_TRADING_SWAP_AMOUNT';

    if (type === 'exchange') {
        return {
            inputLabel: exchangeAmount,
            offerLabel: youGet,
            labelComparatorOffer: youWillGet,
            sendLabel: youPay,
            receiveLabel: youGet,
        };
    }

    if (type === 'sell') {
        return {
            inputLabel: amountInCrypto ? youPay : youGet,
            offerLabel: amountInCrypto ? youGet : youPay,
            labelComparatorOffer: amountInCrypto ? youWillGet : youWillPay,
            sendLabel: youGet,
            receiveLabel: youPay,
        };
    }

    return {
        inputLabel: amountInCrypto ? youGet : youPay,
        offerLabel: amountInCrypto ? youPay : youGet,
        labelComparatorOffer: amountInCrypto ? youWillPay : youWillGet,
        sendLabel: youPay,
        receiveLabel: youGet,
    };
};

/**
 * Rounding up to two decimal places
 */
export const tradingGetRoundedFiatAmount = (amount: string | undefined): string => {
    if (!amount) return '';

    const numberAmount = new BigNumber(amount);

    if (!numberAmount.isNaN()) return numberAmount.toFixed(2, BigNumber.ROUND_HALF_UP);

    return '';
};

export const tradingGetAccountLabel = (label: string, shouldSendInSats: boolean | undefined) =>
    label === 'BTC' && shouldSendInSats ? 'sat' : label;

export const tradingGetSectionActionLabel = (
    type: TradingType,
): Extract<ExtendedMessageDescriptor['id'], 'TR_BUY' | 'TR_TRADING_SELL' | 'TR_TRADING_SWAP'> => {
    if (type === 'buy') return 'TR_BUY';
    if (type === 'sell') return 'TR_TRADING_SELL';

    return 'TR_TRADING_SWAP';
};

interface ResolveAddressAndTokenProps {
    address: string;
    token: string | null;
}

export const resolveAddressAndToken = <A extends Pick<Account, 'symbol' | 'descriptor'>>(
    account: A | undefined | null,
    tokenContractAddress: TokenInfo['contract'] | undefined | null,
): ResolveAddressAndTokenProps => {
    if (!account) {
        return { address: '', token: null };
    }
    const networkType = getNetworkType(account.symbol);

    // set token address for ERC20 transaction to estimate the fees more precisely
    if (networkType === 'ethereum') {
        return {
            address: tokenContractAddress ?? '',
            token: tokenContractAddress ?? null,
        };
    }

    if (networkType === 'solana' && !tokenContractAddress) {
        return { address: account.descriptor, token: null };
    }

    return { address: '', token: tokenContractAddress ?? null };
};

export const getTradeTypeByRoute = (
    routeName: Route['name'] | undefined,
): TradingType | undefined => {
    if (routeName?.startsWith('wallet-trading-buy')) {
        return 'buy';
    }

    if (routeName?.startsWith('wallet-trading-sell')) {
        return 'sell';
    }

    if (routeName?.startsWith('wallet-trading-exchange')) {
        return 'exchange';
    }
};

interface GetTradeProviderProps {
    trade: BuyTrade | ExchangeTrade | SellFiatTrade | undefined;
    providerInfo: TradingGetProvidersInfoProps;
}

export const getTradeProvider = ({ trade, providerInfo }: GetTradeProviderProps) => {
    if (!trade || !trade.exchange) return undefined;

    return providerInfo?.[trade.exchange];
};

interface GetFeeInUnitsProps {
    symbol: NetworkSymbol;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    selectedFee?: FeeLevel['label'];
}

export const getFeeInUnits = ({
    symbol,
    composedLevels,
    selectedFee = 'normal',
}: GetFeeInUnitsProps): string => {
    const selectedFeeLevel = composedLevels?.[selectedFee];
    if (!selectedFeeLevel) return '0';

    if (selectedFeeLevel.type !== 'final' && selectedFeeLevel.type !== 'nonfinal') {
        return '0';
    }

    const { fee } = selectedFeeLevel;

    const feeInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(fee)),
        symbol,
    }).toString();

    return feeInUnits;
};
