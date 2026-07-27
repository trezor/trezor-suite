import type { AddressValidator } from './AddressValidator';
import type { NetworkSymbol } from './networkTypes';
import { adaValidator } from './validators/ada_validator';
import { bitcoinValidator } from './validators/bitcoin_validator';
import { ethereumValidator } from './validators/ethereum_validator';
import { rippleValidator } from './validators/ripple_validator';
import { solanaValidator } from './validators/solana_validator';
import { stellarValidator } from './validators/stellar_validator';
import { tronValidator } from './validators/tron_validator';

const validators = [
    bitcoinValidator,
    ethereumValidator,
    rippleValidator,
    adaValidator,
    solanaValidator,
    stellarValidator,
    tronValidator,
];

const validatorBySymbol = new Map<NetworkSymbol, AddressValidator>();

validators.forEach(validator => {
    validator.getSupportedCoins().forEach(symbol => {
        validatorBySymbol.set(symbol, validator);
    });
});

export const resolveValidator = (symbol: NetworkSymbol): AddressValidator | undefined =>
    validatorBySymbol.get(symbol);

export const getSupportedCoins = (): NetworkSymbol[] => Array.from(validatorBySymbol.keys());
