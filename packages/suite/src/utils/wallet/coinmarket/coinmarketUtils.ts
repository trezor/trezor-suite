import { Account, Network, NetworkSymbol } from 'src/types/wallet';
import { NETWORKS } from 'src/config/wallet';
import TrezorConnect, { TokenInfo } from '@trezor/connect';
import regional from 'src/constants/wallet/coinmarket/regional';
import { TrezorDevice } from 'src/types/suite';
import { CryptoSymbol } from 'invity-api';
import {
    networkToCryptoSymbol,
    tokenToCryptoSymbol,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { TokenDefinitions } from '@suite-common/wallet-types';

/** @deprecated */
const suiteToInvitySymbols: {
    suiteSymbol: string;
    invitySymbol: string;
}[] = [];

export const buildFiatOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const buildCryptoOption = (networkSymbol: NetworkSymbol) => ({
    value: networkSymbol.toUpperCase(),
    label: networkSymbol.toUpperCase(),
    cryptoSymbol: networkToCryptoSymbol(networkSymbol),
});

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

export const getSendCryptoOptions = (
    account: Account,
    supportedSymbols: Set<CryptoSymbol>,
    tokenDefinitions?: TokenDefinitions,
) => {
    const cryptoSymbol = networkToCryptoSymbol(account.symbol);
    if (!cryptoSymbol) {
        return [];
    }

    const options: {
        value: string;
        label: string;
        token?: TokenInfo;
        cryptoSymbol: CryptoSymbol;
    }[] = [{ value: cryptoSymbol, label: cryptoSymbol, cryptoSymbol }];

    if (account.tokens) {
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
            const isTokenKnown = !tokenDefinitions || tokenDefinitions[token.contract].isTokenKnown;
            if (!isTokenKnown) {
                return;
            }

            options.push({
                label: token.symbol.toUpperCase(),
                value: token.symbol.toUpperCase(),
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
    if (symbol === 'tgor') return 'eth';
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
