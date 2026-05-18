import * as ADAValidator from './ada_validator';
import * as BCHValidator from './bch_validator';
import * as BTCValidator from './bitcoin_validator';
import type { Currency } from './currency-types';
import * as ETHValidator from './ethereum_validator';
import * as XRPValidator from './ripple_validator';
import * as SOLValidator from './solana_validator';
import * as XLMValidator from './stellar_validator';
import * as TRXValidator from './tron_validator';

export type { Currency, Validator } from './currency-types';

const CURRENCIES: Currency[] = [
    {
        name: 'Bitcoin',
        symbol: 'btc',
        segwitHrp: { prod: 'bc', testnet: 'tb', regtest: 'bcrt' },
        addressTypes: {
            prod: ['00', '05'],
            testnet: ['6f', 'c4', '3c', '26'],
            regtest: ['6f', 'c4', '3c', '26'],
        },
        validator: BTCValidator,
    },
    {
        name: 'BitcoinCash',
        symbol: 'bch',
        regexp: '^[qQpP]{1}[0-9a-zA-Z]{41}$',
        addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4'] },
        validator: BCHValidator,
    },
    {
        name: 'LiteCoin',
        symbol: 'ltc',
        segwitHrp: { prod: 'ltc', testnet: 'tltc' },
        addressTypes: { prod: ['30', '32'], testnet: ['6f', 'c4', '3a'] },
        validator: BTCValidator,
    },
    {
        name: 'DogeCoin',
        symbol: 'doge',
        addressTypes: { prod: ['1e', '16'], testnet: ['71', 'c4'] },
        validator: BTCValidator,
    },
    {
        name: 'ZCash',
        symbol: 'zec',
        expectedLength: 26,
        addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
        validator: BTCValidator,
    },
    {
        name: 'Ripple',
        symbol: 'xrp',
        validator: XRPValidator,
    },
    {
        name: 'Ethereum',
        symbol: 'eth',
        validator: ETHValidator,
    },
    {
        name: 'EthereumClassic',
        symbol: 'etc',
        validator: ETHValidator,
    },
    {
        name: 'Cardano',
        symbol: 'ada',
        segwitHrp: { prod: 'addr', testnet: 'addr_test', stake: 'stake' },
        validator: ADAValidator,
    },
    {
        name: 'Polygon PoS',
        symbol: 'pol',
        validator: ETHValidator,
    },
    {
        name: 'Tron',
        symbol: 'trx',
        addressTypes: { prod: [0x41], testnet: [0xa0] },
        validator: TRXValidator,
    },
    {
        name: 'Stellar',
        symbol: 'xlm',
        validator: XLMValidator,
    },
    {
        name: 'Solana',
        symbol: 'sol',
        validator: SOLValidator,
    },
    {
        name: 'BNB Smart Chain',
        symbol: 'bsc',
        validator: ETHValidator,
    },
    {
        name: 'Arbitrum One',
        symbol: 'arb', // TODO
        validator: ETHValidator,
    },
    {
        name: 'Base',
        symbol: 'base', // TODO
        validator: ETHValidator,
    },
    {
        name: 'Optimism',
        symbol: 'op', // TODO
        validator: ETHValidator,
    },
    {
        name: 'Avalanche C-Chain',
        symbol: 'avax',
        validator: ETHValidator,
    },
];

export function getByNameOrSymbol(currencyNameOrSymbol: string): Currency | undefined {
    const nameOrSymbol = currencyNameOrSymbol.toLowerCase();

    return CURRENCIES.find(
        currency =>
            currency.name.toLowerCase() === nameOrSymbol ||
            currency.symbol.toLowerCase() === nameOrSymbol,
    );
}

export function getAll(): Currency[] {
    return CURRENCIES;
}

// spit out details for readme.md
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`* ${c.name}/${c.symbol} \`'${c.name}'\` or \`'${c.symbol}'\` `));

//spit out keywords for package.json
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`"${c.name}","${c.symbol}",`));
