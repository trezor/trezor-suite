import { CryptoId } from 'invity-api';

import { DefinitionType, isTokenDefinitionKnown } from '@suite-common/token-definitions';
import { type TradingType, cryptoIdToSymbol, toTokenCryptoId } from '@suite-common/trading';
import {
    Network,
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
    getNetworkFeatures,
    getNetworkType,
} from '@suite-common/wallet-config';
import {
    getContractAddressForNetworkSymbol,
    sortByCoin,
    substituteBip43Path,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { ExtendedMessageDescriptor, Route, TrezorDevice } from 'src/types/suite';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingAccountsOptionsGroupProps,
    TradingBuildAccountOptionsProps,
    TradingGetAmountLabelsProps,
    TradingGetAmountLabelsReturnProps,
    TradingGetSortedAccountsProps,
} from 'src/types/trading/trading';
import { Account } from 'src/types/wallet';

interface TradingGetDecimalsProps {
    sendCryptoSelect?: TradingAccountOptionsGroupOptionProps;
    network?: Network | null;
}

export const getTradingNetworkDecimals = ({
    sendCryptoSelect,
    network,
}: TradingGetDecimalsProps) => {
    if (sendCryptoSelect) {
        return sendCryptoSelect.decimals;
    }

    return network?.decimals ?? 8;
};

export const buildFiatOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

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
                    useEmptyPassphrase: device.useEmptyPassphrase,
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
        case 'cardano':
            // it is not possible to use change address of the current account as the placeholder, some exchanges use Byron addresses
            // which need more fees than Shelley addresses used in the Suite, using dummy Byron address for the placeholder
            // return '37btjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na';
            return '';
        case 'solana':
        case 'ethereum':
        case 'ripple':
            return account.descriptor;
        // no default
    }
};

export const tradingGetSortedAccounts = ({
    accounts,
    deviceState,
}: TradingGetSortedAccountsProps) => {
    if (!deviceState) return [];

    return sortByCoin(
        accounts.filter(
            a => a.deviceState === deviceState && a.visible && a.accountType !== 'coinjoin',
        ),
    );
};

export const tradingBuildAccountOptions = ({
    deviceState,
    accounts,
    accountLabels,
    tokenDefinitions,
    supportedCryptoIds,
    getDefaultAccountLabel,
}: TradingBuildAccountOptionsProps): TradingAccountsOptionsGroupProps[] => {
    const accountsSorted = tradingGetSortedAccounts({
        accounts,
        deviceState,
    });

    const groups: TradingAccountsOptionsGroupProps[] = [];

    accountsSorted.forEach(account => {
        const {
            descriptor,
            tokens,
            symbol: accountSymbol,
            formattedBalance,
            index,
            accountType,
        } = account;

        const network = getNetwork(accountSymbol);

        if (!network.tradeCryptoId) {
            return;
        }

        const groupLabel =
            accountLabels[account.key] ??
            getDefaultAccountLabel({
                accountType,
                symbol: accountSymbol,
                index,
            });

        const accountDecimals = network.decimals;
        const option: TradingAccountOptionsGroupOptionProps = {
            value: network.tradeCryptoId as CryptoId,
            label: getNetworkDisplaySymbol(accountSymbol),
            cryptoName: getNetworkDisplaySymbolName(accountSymbol),
            descriptor,
            balance: formattedBalance ?? '',
            accountType: account.accountType,
            decimals: accountDecimals,
        };
        const options: TradingAccountOptionsGroupOptionProps[] = [option];

        const hasNativeToken = options.length > 0;

        // add crypto tokens to options
        if (tokens && tokens.length > 0) {
            const hasCoinDefinitions = getNetworkFeatures(account.symbol).includes(
                'coin-definitions',
            );
            const coinDefinitions = tokenDefinitions?.[account.symbol]?.[DefinitionType.COIN];

            tokens.forEach(token => {
                const { symbol, balance, contract, name } = token;
                if (!symbol || !balance || balance === '0') {
                    return;
                }

                const contractAddress = getContractAddressForNetworkSymbol(accountSymbol, contract);

                const tokenCryptoId = toTokenCryptoId(accountSymbol, contractAddress);
                if (supportedCryptoIds && !supportedCryptoIds.has(tokenCryptoId)) {
                    return;
                }

                // exclude unknown tokens
                if (
                    hasCoinDefinitions &&
                    coinDefinitions &&
                    !isTokenDefinitionKnown(coinDefinitions.data, account.symbol, token.contract)
                ) {
                    return;
                }

                options.push({
                    value: tokenCryptoId,
                    label: symbol.toUpperCase(),
                    cryptoName: name,
                    contractAddress: contract,
                    descriptor,
                    accountType,
                    balance: balance ?? '',
                    decimals: token.decimals,
                });
            });
        }

        const hasTokens = hasNativeToken && options.length > 1;

        // exclude account if the native token has 0 balance and has no other tokens
        if (!hasTokens && hasNativeToken && options[0].balance === '0') {
            return;
        }

        groups.push({
            label: groupLabel,
            options,
        });
    });

    return groups.filter(group => group.options.length > 0);
};

export const tradingGetAmountLabels = ({
    type,
    amountInCrypto,
}: TradingGetAmountLabelsProps): TradingGetAmountLabelsReturnProps => {
    const youGet = 'TR_TRADING_YOU_GET';
    const youPay = 'TR_TRADING_YOU_PAY';
    const youWillGet = 'TR_TRADING_YOU_WILL_GET';
    const youWillPay = 'TR_TRADING_YOU_WILL_PAY';
    const youReceive = 'TR_TRADING_YOU_RECEIVE';
    const exchange = 'TR_TRADING_SWAP';
    const exchangeAmount = 'TR_TRADING_SWAP_AMOUNT';

    if (type === 'exchange') {
        return {
            inputLabel: exchangeAmount,
            offerLabel: youGet,
            labelComparatorOffer: youWillGet,
            sendLabel: exchange,
            receiveLabel: youReceive,
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

interface GetAddressAndTokenFromAccountOptionsGroupProps {
    address: string;
    token: string | null;
}

export const getAddressAndTokenFromAccountOptionsGroupProps = (
    selected: TradingAccountOptionsGroupOptionProps | undefined,
): GetAddressAndTokenFromAccountOptionsGroupProps => {
    if (!selected) {
        return { address: '', token: null };
    }

    const symbol = cryptoIdToSymbol(selected.value);
    const networkType = symbol ? getNetworkType(symbol) : null;

    // set token address for ERC20 transaction to estimate the fees more precisely
    if (networkType === 'ethereum') {
        return {
            address: selected.contractAddress ?? '',
            token: selected.contractAddress ?? null,
        };
    }

    if (networkType === 'solana' && !selected.contractAddress) {
        return { address: selected.descriptor, token: null };
    }

    return { address: '', token: selected.contractAddress ?? null };
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
