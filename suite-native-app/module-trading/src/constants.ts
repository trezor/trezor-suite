import { type Insets } from 'react-native';

import type { CryptoId } from 'invity-api';

import { type TradingType } from '@suite-common/trading';
import { nativeSpacings } from '@trezor/theme';

export const TRADING_DEX_SOURCE_ORIGIN = 'trezor-suite-native://trading-dex-swap';

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;
const USDT_ETHEREUM_CRYPTO_ID = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;

type TradingFormDefaultAssets = {
    send: readonly CryptoId[];
    receive: readonly CryptoId[];
};

export const TRADING_FORM_DEFAULT_ASSETS: Record<TradingType, TradingFormDefaultAssets> = {
    buy: { send: [], receive: [BITCOIN_CRYPTO_ID] },
    sell: { send: [BITCOIN_CRYPTO_ID, ETHEREUM_CRYPTO_ID], receive: [] },
    exchange: { send: [USDT_ETHEREUM_CRYPTO_ID], receive: [BITCOIN_CRYPTO_ID] },
};

export const CRYPTO_AMOUNT_INPUT_HIT_SLOP: Insets = {
    top: nativeSpacings.sp16,
    left: nativeSpacings.sp20,
};
