import { type TranslationKey } from '@suite/intl';
import { type TradingBridgeSpeed } from '@suite-common/trading';
import { type IconComponent } from '@trezor/components';
import { ClockIcon, LightningIcon } from '@trezor/icons';

type BridgeSpeedOption = {
    nameId: TranslationKey;
    descriptionId: TranslationKey;
    icon: IconComponent;
};

export const BRIDGE_SPEED_OPTIONS = {
    fast: {
        nameId: 'TR_TRADING_BRIDGE_SPEED_FAST',
        descriptionId: 'TR_TRADING_BRIDGE_SPEED_FAST_DESC',
        icon: LightningIcon,
    },
    standard: {
        nameId: 'TR_TRADING_BRIDGE_SPEED_STANDARD',
        descriptionId: 'TR_TRADING_BRIDGE_SPEED_STANDARD_DESC',
        icon: ClockIcon,
    },
} as const satisfies Record<TradingBridgeSpeed, BridgeSpeedOption>;
