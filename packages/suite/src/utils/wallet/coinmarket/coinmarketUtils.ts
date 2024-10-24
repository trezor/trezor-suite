import { Account } from 'src/types/wallet';
import {
    Network,
    NetworkSymbol,
    getCoingeckoId,
    getNetworkByCoingeckoId,
    getNetworkByCoingeckoNativeId,
    getNetworkFeatures,
    networks,
} from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';
import regional from 'src/constants/wallet/coinmarket/regional';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';
import { BuyTrade, SellFiatTrade, CryptoId } from 'invity-api';
import { DefinitionType, isTokenDefinitionKnown } from '@suite-common/token-definitions';
import { getContractAddressForNetwork, substituteBip43Path } from '@suite-common/wallet-utils';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketAccountsOptionsGroupProps,
    CoinmarketBuildAccountOptionsProps,
    CoinmarketGetAmountLabelsProps,
    CoinmarketGetAmountLabelsReturnProps,
    CoinmarketGetSortedAccountsProps,
    CoinmarketTradeBuySellDetailMapProps,
    CoinmarketTradeBuySellType,
    CoinmarketTradeDetailMapProps,
    CoinmarketTradeDetailType,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { v4 as uuidv4 } from 'uuid';
import { BigNumber } from '@trezor/utils';
import { sortByCoin } from '@suite-common/wallet-utils';

export const cryptoPlatformSeparator = '--';

interface ParsedCryptoId {
    networkId: CryptoId;
    contractAddress: string | undefined;
}

export function parseCryptoId(cryptoId: CryptoId): ParsedCryptoId {
    const parts = cryptoId.split(cryptoPlatformSeparator);

    return { networkId: parts[0] as CryptoId, contractAddress: parts[1] };
}

export function cryptoIdToNetwork(cryptoId: CryptoId): Network | undefined {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return contractAddress
        ? getNetworkByCoingeckoId(networkId)
        : getNetworkByCoingeckoNativeId(networkId);
}

export function cryptoIdToNetworkSymbol(cryptoId: CryptoId): NetworkSymbol | undefined {
    return cryptoIdToNetwork(cryptoId)?.symbol;
}

export function toTokenCryptoId(networkId: NetworkSymbol, contractAddress: string): CryptoId {
    return `${getCoingeckoId(networkId)}${cryptoPlatformSeparator}${contractAddress}` as CryptoId;
}

/** Convert testnet cryptoId to prod cryptoId (test-bitcoin -> bitcoin) */
export function testnetToProdCryptoId(cryptoId: CryptoId): CryptoId {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return ((networkId.split('test-')?.[1] ?? networkId) +
        (contractAddress ? `${cryptoPlatformSeparator}${contractAddress}` : '')) as CryptoId;
}

export const getNetworkName = (networkSymbol: NetworkSymbol) => {
    return networks[networkSymbol].name;
};

export const getNetworkDecimals = (networkDecimals: number | undefined) => {
    return networkDecimals ?? 8;
};

/** @deprecated */
const suiteToInvitySymbols: {
    suiteSymbol: string;
    invitySymbol: string;
}[] = [];

export const buildFiatOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

/** @deprecated */
export const invityApiSymbolToSymbol = (symbol?: string) => {
    if (!symbol) return 'UNKNOWN';
    const lowercaseSymbol = symbol.toLowerCase();
    const result = suiteToInvitySymbols.find(s => s.invitySymbol === lowercaseSymbol);

    return result ? result.suiteSymbol : lowercaseSymbol;
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
        case 'ethereum':
        case 'ripple':
        case 'solana':
            return account.descriptor;
        // no default
    }
};

export const mapTestnetSymbol = (symbol: NetworkSymbol) => {
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

export const coinmarketGetSuccessQuotes = <T extends CoinmarketTradeType>(
    quotes: CoinmarketTradeDetailMapProps[T][] | undefined,
) => (quotes ? quotes.filter(quote => quote.error === undefined) : undefined);

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

export const coinmarketGetSortedAccounts = ({
    accounts,
    deviceState,
}: CoinmarketGetSortedAccountsProps) => {
    if (!deviceState) return [];

    return sortByCoin(
        accounts.filter(
            a => a.deviceState === deviceState && a.visible && a.accountType !== 'coinjoin',
        ),
    );
};

export const coinmarketBuildAccountOptions = ({
    deviceState,
    accounts,
    accountLabels,
    tokenDefinitions,
    supportedCryptoIds,
    getDefaultAccountLabel,
}: CoinmarketBuildAccountOptionsProps): CoinmarketAccountsOptionsGroupProps[] => {
    const accountsSorted = coinmarketGetSortedAccounts({
        accounts,
        deviceState,
    });

    const groups: CoinmarketAccountsOptionsGroupProps[] = [];

    accountsSorted.forEach(account => {
        const {
            descriptor,
            tokens,
            symbol: accountSymbol,
            formattedBalance,
            index,
            accountType,
        } = account;

        if (!networks[accountSymbol].coingeckoNativeId) {
            return;
        }

        const groupLabel =
            accountLabels[account.key] ??
            getDefaultAccountLabel({
                accountType,
                symbol: accountSymbol,
                index,
            });

        const accountDecimals = networks[accountSymbol].decimals;
        const options: CoinmarketAccountOptionsGroupOptionProps[] = [
            {
                value: networks[accountSymbol].coingeckoNativeId as CryptoId,
                label: accountSymbol.toUpperCase(),
                cryptoName: getNetworkName(accountSymbol),
                descriptor,
                balance: formattedBalance ?? '',
                accountType: account.accountType,
                decimals: accountDecimals,
            },
        ];

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

                const contractAddress = getContractAddressForNetwork(accountSymbol, contract);

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

        groups.push({
            label: groupLabel,
            options,
        });
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
    const youReceive = 'TR_COINMARKET_YOU_RECEIVE';
    const exchange = 'TR_COINMARKET_SWAP';
    const exchangeAmount = 'TR_COINMARKET_SWAP_AMOUNT';

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
    'TR_BUY' | 'TR_COINMARKET_SELL' | 'TR_COINMARKET_SWAP'
> => {
    if (type === 'buy') return 'TR_BUY';
    if (type === 'sell') return 'TR_COINMARKET_SELL';

    return 'TR_COINMARKET_SWAP';
};
