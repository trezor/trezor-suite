import { type Insets } from 'react-native';

import { nativeSpacings } from '@trezor/theme';

export const TRADING_DEX_SOURCE_ORIGIN = 'trezor-suite-native://trading-dex-swap';

export const CRYPTO_AMOUNT_INPUT_HIT_SLOP: Insets = {
    top: nativeSpacings.sp16,
    left: nativeSpacings.sp20,
};
