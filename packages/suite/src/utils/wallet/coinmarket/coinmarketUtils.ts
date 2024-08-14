import { Account, Network } from 'src/types/wallet';
import { NETWORKS } from 'src/config/wallet';
import TrezorConnect, { TokenInfo } from '@trezor/connect';
import regional from 'src/constants/wallet/coinmarket/regional';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';
import { BuyTrade, CryptoSymbol, SellFiatTrade } from 'invity-api';
import {
    cryptoToCoinSymbol,
    cryptoToNetworkSymbol,
    getNetworkName,
    isCryptoSymbolToken,
    networkToCryptoSymbol,
    tokenToCryptoSymbol,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import {
    DefinitionType,
    TokenDefinitions,
    isTokenDefinitionKnown,
} from '@suite-common/token-definitions';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketAccountsOptionsGroupProps,
    CoinmarketBuildAccountOptionsProps,
    CoinmarketBuildOptionsProps,
    CoinmarketCryptoListProps,
    CoinmarketGetAmountLabelsProps,
    CoinmarketGetAmountLabelsReturnProps,
    CoinmarketGetSortedAccountsProps,
    CoinmarketOptionsGroupProps,
    CoinmarketTradeBuySellDetailMapProps,
    CoinmarketTradeBuySellType,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeDetailType,
    CoinmarketTradeType,
    CryptoCategoryType,
} from 'src/types/coinmarket/coinmarket';
import { v4 as uuidv4 } from 'uuid';
import { BigNumber } from '@trezor/utils';
import CryptoCategories, {
    CryptoCategoryA,
    CryptoCategoryB,
    CryptoCategoryC,
    CryptoCategoryD,
    CryptoCategoryE,
} from 'src/constants/wallet/coinmarket/cryptoCategories';
import { sortByCoin } from '@suite-common/wallet-utils';

/** @deprecated */
const suiteToInvitySymbols: {
    suiteSymbol: string;
    invitySymbol: string;
}[] = [];

export const buildFiatOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const buildCryptoOption = (cryptoSymbol: CryptoSymbol): CoinmarketCryptoListProps => {
    const networkSymbol = cryptoToNetworkSymbol(cryptoSymbol);

    return {
        value: cryptoSymbol,
        label: cryptoToCoinSymbol(cryptoSymbol),
        cryptoName: networkSymbol ? getNetworkName(networkSymbol) : null,
    };
};

/** @deprecated */
export const invityApiSymbolToSymbol = (symbol?: string) => {
    if (!symbol) return 'UNKNOWN';
    const lowercaseSymbol = symbol.toLowerCase();
    const result = suiteToInvitySymbols.find(s => s.invitySymbol === lowercaseSymbol);

    return result ? result.suiteSymbol : lowercaseSymbol;
};

/** @deprecated */
export const symbolToInvityApiSymbol = (symbol?: string) => {
    if (!symbol) return 'UNKNOWN';
    const result = suiteToInvitySymbols.find(s => s.suiteSymbol === symbol.toLowerCase());

    return result ? result.invitySymbol : symbol;
};

/** @deprecated */
export const getSendCryptoOptions = (
    account: Account,
    supportedSymbols: Set<CryptoSymbol>,
    coinDefinitions?: TokenDefinitions[DefinitionType.COIN],
) => {
    const cryptoSymbol = networkToCryptoSymbol(account.symbol);
    if (!cryptoSymbol) {
        return [];
    }

    const options: {
        value: CryptoSymbol;
        label: string;
        token?: TokenInfo;
        cryptoSymbol: CryptoSymbol;
    }[] = [{ value: cryptoSymbol, label: cryptoSymbol, cryptoSymbol }];

    if (account.tokens) {
        const hasCoinDefinitions = getNetworkFeatures(account.symbol).includes('coin-definitions');

        account.tokens.forEach(token => {
            if (!token.symbol || token.balance === '0') {
                return;
            }

            const tokenCryptoSymbol = tokenToCryptoSymbol(token.symbol, account.symbol);
            if (!tokenCryptoSymbol) {
                return;
            }

            if (!supportedSymbols.has(tokenCryptoSymbol)) {
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
                label: token.symbol.toUpperCase(),
                value: tokenCryptoSymbol,
                token,
                cryptoSymbol: tokenCryptoSymbol,
            });
        });
    }

    return options;
};

export const getUnusedAddressFromAccount = (account: Account) => {
    switch (account.networkType) {
        case 'cardano':
        case 'bitcoin': {
            const firstUnused = account.addresses?.unused[0];
            if (firstUnused) {
                return { address: firstUnused.address, path: firstUnused.path };
            }

            return { address: undefined, path: undefined };
        }
        case 'ripple':
        case 'ethereum':
        case 'solana': {
            return {
                address: account.descriptor,
                path: account.path,
            };
        }
        // no default
    }
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
    } catch (err) {
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
            const legacy =
                NETWORKS.find(
                    network =>
                        network.symbol === account.symbol && network.accountType === 'legacy',
                ) ||
                NETWORKS.find(
                    network =>
                        network.symbol === account.symbol && network.accountType === 'segwit',
                ) ||
                network;
            if (legacy && device) {
                // try to get the already discovered legacy account
                const legacyPath = `${legacy.bip43Path.replace('i', '0')}`;
                const legacyAccount = accounts?.find(a => a.path === legacyPath);
                if (legacyAccount?.addresses?.unused[0]) {
                    return legacyAccount?.addresses?.unused[0].address;
                }
                // if it is not discovered, get an address from trezor
                const result = await TrezorConnect.getAddress({
                    device,
                    coin: legacy.symbol,
                    path: `${legacy.bip43Path.replace('i', '0')}/0/0`,
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
            return '37btjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na';
        case 'ethereum':
        case 'ripple':
        case 'solana':
            return account.descriptor;
        // no default
    }
};

export const mapTestnetSymbol = (symbol: Network['symbol']) => {
    if (symbol === 'test') return 'btc';
    if (symbol === 'tsep') return 'eth';
    if (symbol === 'thol') return 'eth';
    if (symbol === 'txrp') return 'xrp';
    if (symbol === 'tada') return 'ada';

    return symbol;
};

export const getTagAndInfoNote = (quote: { infoNote?: string }) => {
    let tag = '';
    let infoNote = (quote?.infoNote || '').trim();
    if (infoNote.startsWith('#')) {
        const splitNote = infoNote?.split('#') || [];
        if (splitNote.length === 3) {
            // infoNote contains "#badge_text#info_note_text"
            [, tag, infoNote] = splitNote;
        } else if (splitNote.length === 2) {
            // infoNote contains "#badge_text"
            infoNote = '';
            tag = splitNote.pop() || '';
        }
    }

    return { tag, infoNote };
};

export const getDefaultCountry = (country: string = regional.unknownCountry) => {
    const label = regional.countriesMap.get(country);

    if (!label)
        return {
            label: regional.countriesMap.get(regional.unknownCountry)!,
            value: regional.unknownCountry,
        };

    return {
        label,
        value: country,
    };
};

export const filterQuotesAccordingTags = <T extends CoinmarketTradeBuySellType>(
    allQuotes: CoinmarketTradeBuySellDetailMapProps[T][],
) => {
    return allQuotes.filter(q => !q.tags || !q.tags.includes('alternativeCurrency'));
};

// fill orderId for all and paymentId for sell and buy
export const addIdsToQuotes = <T extends CoinmarketTradeType>(
    allQuotes: CoinmarketTradeDetailMapProps[T][] | undefined,
    type: CoinmarketTradeType,
): CoinmarketTradeDetailMapProps[T][] => {
    if (!allQuotes) allQuotes = [];

    allQuotes.forEach(q => {
        const sellBuyQuote = ['buy', 'sell'].includes(type)
            ? (q as BuyTrade | SellFiatTrade)
            : null;

        if (sellBuyQuote && !sellBuyQuote.paymentId) {
            sellBuyQuote.paymentId = uuidv4();
        }

        q.orderId = uuidv4();
    });

    return allQuotes;
};

export const getBestRatedQuote = (
    quotes: CoinmarketTradeDetailType[] | undefined,
    type: CoinmarketTradeType,
): CoinmarketTradeDetailType | undefined => {
    const quotesFiltered = quotes?.filter(item => item.rate && item.rate !== 0);
    const bestRatedQuotes = quotesFiltered
        ? [...quotesFiltered].sort((a, b) => {
              // ascending to rate for buy - lower rate more crypto client receives
              if (type === 'buy') {
                  return new BigNumber(a.rate ?? 0).minus(new BigNumber(b.rate ?? 0)).toNumber();
              }

              // descending to rate for sell/exchange - higher rate more crypto/fiat client receives
              return new BigNumber(b.rate ?? 0).minus(new BigNumber(a.rate ?? 0)).toNumber();
          })
        : null;
    const bestRatedQuote = bestRatedQuotes?.[0];

    return bestRatedQuote;
};

export const coinmarketBuildCryptoOptions = ({
    symbolsInfo,
    cryptoCurrencies,
}: CoinmarketBuildOptionsProps) => {
    const groups: CoinmarketOptionsGroupProps[] = Object.keys(CryptoCategories).map(category => ({
        label: category as CryptoCategoryType,
        options: [],
    }));

    cryptoCurrencies.forEach(symbol => {
        const coinSymbol = cryptoToCoinSymbol(symbol);
        const symbolInfo = symbolsInfo?.find(symbolInfoItem => symbolInfoItem.symbol === symbol);
        const cryptoSymbol = cryptoToNetworkSymbol(symbol);

        const option = {
            value: symbol,
            label: coinSymbol.toUpperCase(),
            cryptoName: symbolInfo?.name ?? null,
        };

        const pushOption = (category: CryptoCategoryType) => {
            const group = groups.find(g => g.label === category);

            group?.options.push(option);
        };

        // popular
        if (symbolInfo?.category === CryptoCategoryA) {
            pushOption(CryptoCategoryA);

            return;
        }

        // tokens
        if (isCryptoSymbolToken(symbol)) {
            const networksWithCategoryName: CryptoCategoryType[] = [
                CryptoCategoryB,
                CryptoCategoryC,
                CryptoCategoryD,
            ];

            networksWithCategoryName.forEach(network => {
                if (CryptoCategories[network]?.network === cryptoSymbol) {
                    pushOption(network);

                    return;
                }
            });

            return;
        }

        // default
        pushOption(CryptoCategoryE);
    });

    return groups;
};

export const coinmarketGetSortedAccounts = ({
    accounts,
    deviceState,
}: CoinmarketGetSortedAccountsProps) => {
    if (!deviceState) return [];

    return sortByCoin(accounts.filter(a => a.deviceState === deviceState));
};

export const coinmarketBuildAccountOptions = ({
    symbolsInfo,
    deviceState,
    accounts,
    accountLabels,
    tokenDefinitions,
    supportedSymbols,
    defaultAccountLabelString,
}: CoinmarketBuildAccountOptionsProps): CoinmarketAccountsOptionsGroupProps[] => {
    const accountsSorted = coinmarketGetSortedAccounts({
        accounts,
        deviceState,
    });

    const groups: CoinmarketAccountsOptionsGroupProps[] = accountsSorted.map(account => {
        const {
            descriptor,
            tokens,
            symbol: accountSymbol,
            formattedBalance,
            index,
            accountType,
        } = account;

        const groupLabel =
            accountLabels[account.key] ??
            defaultAccountLabelString({
                accountType,
                symbol: accountSymbol,
                index,
            });
        const foundSymbolInfo = symbolsInfo?.find(
            item => item.symbol === networkToCryptoSymbol(accountSymbol),
        );

        const options: CoinmarketAccountOptionsGroupOptionProps[] = [
            {
                value: foundSymbolInfo?.symbol ?? (accountSymbol.toUpperCase() as CryptoSymbol),
                label: accountSymbol.toUpperCase(),
                cryptoName: foundSymbolInfo?.name ?? null,
                descriptor,
                balance: formattedBalance ?? '',
            },
        ];
        // add crypto tokens to options
        if (tokens && tokens.length > 0) {
            const hasCoinDefinitions = getNetworkFeatures(account.symbol).includes(
                'coin-definitions',
            );
            const coinDefinitions = tokenDefinitions?.[account.symbol]?.[DefinitionType.COIN];

            tokens.forEach(token => {
                const { symbol, balance, contract } = token;

                if (!symbol || !balance || balance === '0') {
                    return;
                }

                const tokenCryptoSymbol = tokenToCryptoSymbol(symbol, account.symbol);

                if (!tokenCryptoSymbol) {
                    return;
                }

                if (supportedSymbols && !supportedSymbols.has(tokenCryptoSymbol)) {
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

                const tokenSymbolInfo = symbolsInfo?.find(
                    item => item.symbol === tokenCryptoSymbol,
                );

                options.push({
                    value: tokenSymbolInfo?.symbol ?? (symbol as CryptoSymbol),
                    label: symbol.toUpperCase(),
                    cryptoName: tokenSymbolInfo?.name ?? null,
                    contractAddress: contract,
                    descriptor,
                    balance: balance ?? '',
                });
            });
        }

        return {
            label: groupLabel,
            options,
        };
    });

    return groups;
};

export const coinmarketGetAmountLabels = ({
    type,
    amountInCrypto,
}: CoinmarketGetAmountLabelsProps): CoinmarketGetAmountLabelsReturnProps => {
    const youGet = 'TR_COINMARKET_YOU_GET';
    const youPay = 'TR_COINMARKET_YOU_PAY';
    const youWillGet = 'TR_COINMARKET_YOU_WILL_GET';
    const youWillPay = 'TR_COINMARKET_YOU_WILL_PAY';

    if (type === 'exchange') {
        return {
            label1: youPay,
            label2: youGet,
            labelComparatorOffer: youWillGet,
        };
    }

    if (type === 'sell') {
        return {
            label1: amountInCrypto ? youPay : youGet,
            label2: amountInCrypto ? youGet : youPay,
            labelComparatorOffer: amountInCrypto ? youWillGet : youWillPay,
        };
    }

    return {
        label1: amountInCrypto ? youGet : youPay,
        label2: amountInCrypto ? youPay : youGet,
        labelComparatorOffer: amountInCrypto ? youWillPay : youWillGet,
    };
};

/**
 * Rounding up to two decimal places
 */
export const coinmarketGetRoundedFiatAmount = (amount: string | undefined): string => {
    if (!amount) return '';

    const numberAmount = new BigNumber(amount);

    if (!numberAmount.isNaN()) return numberAmount.toFixed(2, BigNumber.ROUND_HALF_UP);

    return '';
};

export const coinmarketGetAccountLabel = (label: string, shouldSendInSats: boolean | undefined) =>
    label === 'BTC' && shouldSendInSats ? 'sat' : label;

export const coinmarketGetSectionActionLabel = (
    type: CoinmarketTradeType,
): Extract<
    ExtendedMessageDescriptor['id'],
    'TR_BUY' | 'TR_COINMARKET_SELL' | 'TR_COINMARKET_EXCHANGE'
> => {
    if (type === 'buy') return 'TR_BUY';
    if (type === 'sell') return 'TR_COINMARKET_SELL';

    return 'TR_COINMARKET_EXCHANGE';
};
