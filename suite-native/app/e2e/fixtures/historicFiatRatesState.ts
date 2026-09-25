import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type RatesByTimestamps, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type PreloadedState } from '@suite-native/state';

import {
    PRELOADED_BTC_ACCOUNT_DESCRIPTOR,
    PRELOADED_BTC_ACCOUNT_KEY,
    PRELOADED_BTC_DEVICE_STATE,
} from './portfolioTrackerBtcAccountState';

/**
 * The only transaction in the mainnet history of PRELOADED_BTC_ACCOUNT_DESCRIPTOR, so a backend
 * refresh returns exactly this and leaves the preloaded list alone.
 */
export const SENTINEL_TX_ID = 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393';

const SENTINEL_TX_BLOCK_TIME = 1644984426;
const SENTINEL_TX_AMOUNT_SATS = '1063';

/** Historic rates are keyed by the block time rounded down to the whole hour. */
const SENTINEL_TX_HOUR = 1644984000;

/**
 * Deliberately absurd: BTC never traded at $10M, so a fiat amount derived from this rate cannot
 * have come from the rates API. 1063 sats * $10M/BTC = $106.30, against ~$0.47 at the real
 * February 2022 price.
 */
const SENTINEL_RATE = 10_000_000;

export const SENTINEL_FIAT_AMOUNT = '106.30';

// Branded key/timestamp types cannot be expressed by an object literal, hence the single cast.
const sentinelHistoricRates = {
    [getFiatRateKey(asNetworkSymbol('btc'), 'usd')]: { [SENTINEL_TX_HOUR]: SENTINEL_RATE },
} as unknown as RatesByTimestamps;

const sentinelTransaction = {
    type: 'sent',
    txid: SENTINEL_TX_ID,
    blockTime: SENTINEL_TX_BLOCK_TIME,
    blockHeight: 723535,
    blockHash: '000000000000000000072040469b223ea7102586584ffe1c544a01bc8a027f35',
    amount: SENTINEL_TX_AMOUNT_SATS,
    fee: '129',
    vsize: 110,
    feeRate: '1.17',
    symbol: 'btc',
    descriptor: PRELOADED_BTC_ACCOUNT_DESCRIPTOR,
    deviceState: PRELOADED_BTC_DEVICE_STATE,
    targets: [
        {
            n: 0,
            addresses: ['bc1qlzk7w0u23gpem4zy6jgfqn8lh06lclhkntm5xq'],
            isAddress: true,
            amount: SENTINEL_TX_AMOUNT_SATS,
        },
    ],
    tokens: [],
    internalTransfers: [],
    details: {
        vin: [
            {
                txid: 'b6afb70a2b91c80339cc4bbbbc8d09a38d44ee59d85d8073fb112733e8f904f6',
                vout: 1,
                sequence: 4294967295,
                n: 0,
                addresses: ['bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa'],
                isAddress: true,
                isOwn: true,
                value: '1192',
                isAccountOwned: true,
            },
        ],
        vout: [
            {
                value: SENTINEL_TX_AMOUNT_SATS,
                n: 0,
                hex: '0014f8ade73f8a8a039dd444d490904cffbbf5fc7ef6',
                addresses: ['bc1qlzk7w0u23gpem4zy6jgfqn8lh06lclhkntm5xq'],
                isAddress: true,
            },
        ],
        size: 192,
        totalInput: '1192',
        totalOutput: SENTINEL_TX_AMOUNT_SATS,
    },
} as unknown as WalletAccountTransaction; // to omit unnecessary fields

/**
 * State fragment that gives the preloaded BTC account one transaction and a historic rate for it,
 * so the account detail screen renders a fiat amount that could only come from this rate.
 */
export const historicFiatRatesState: PreloadedState = {
    wallet: {
        transactions: {
            transactions: {
                [PRELOADED_BTC_ACCOUNT_KEY]: [sentinelTransaction],
            },
        },
        fiat: {
            historic: sentinelHistoricRates,
        },
    },
};
