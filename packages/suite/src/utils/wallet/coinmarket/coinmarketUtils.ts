import { Account } from '@wallet-types';

const suiteToInvitySymbols = [
    {
        suiteSymbol: 'usdt',
        invitySymbol: 'usdt20',
    },
];

export const buildOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

export const invityApiSymbolToSymbol = (symbol?: string) => {
    if (!symbol) return 'UNKNOWN';
    const lowercaseSymbol = symbol.toLowerCase();
    const result = suiteToInvitySymbols.find(s => s.invitySymbol === lowercaseSymbol);
    return result ? result.suiteSymbol : lowercaseSymbol;
};

export const symbolToInvityApiSymbol = (symbol?: string) => {
    if (!symbol) return 'UNKNOWN';
    const result = suiteToInvitySymbols.find(s => s.suiteSymbol === symbol.toLowerCase());
    return result ? result.invitySymbol : symbol;
};

export function formatCryptoAmount(amount: number, decimals = 8): string {
    let digits = 4;
    if (amount < 1) {
        digits = 6;
    }
    if (amount < 0.01) {
        digits = decimals;
    }
    return amount.toFixed(digits);
}

export const getUnusedAddressFromAccount = (account: Account) => {
    switch (account.networkType) {
        case 'bitcoin': {
            const firstUnused = account.addresses?.unused[0];
            if (firstUnused) {
                return { address: firstUnused.address, path: firstUnused.path };
            }

            return { address: undefined, path: undefined };
        }
        case 'ripple':
        case 'ethereum': {
            return {
                address: account.descriptor,
                path: account.path,
            };
        }
        // no default
    }
};
