import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingBridgeSpeed, formatSlippagePercent } from '@suite-common/trading';
import { exhaustive } from '@trezor/type-utils';

const BRIDGE_SPEED_NAME_ID = {
    fast: 'TR_TRADING_BRIDGE_SPEED_FAST',
    standard: 'TR_TRADING_BRIDGE_SPEED_STANDARD',
} as const satisfies Record<TradingBridgeSpeed, TranslationKey>;

type TradingExchangeBridgeSpeedLabelProps = {
    bridgeSpeed: TradingBridgeSpeed;
    fastFeePercent?: string;
};

export const TradingExchangeBridgeSpeedLabel = ({
    bridgeSpeed,
    fastFeePercent,
}: TradingExchangeBridgeSpeedLabelProps) => {
    const { locale } = useIntl();

    const getFee = (): ReactNode => {
        switch (bridgeSpeed) {
            case 'fast':
                return fastFeePercent === undefined
                    ? undefined
                    : formatSlippagePercent({ slippage: fastFeePercent, locale });
            case 'standard':
                return <Translation id="TR_TRADING_BRIDGE_SPEED_FREE" />;
            default:
                return exhaustive(bridgeSpeed);
        }
    };
    const fee = getFee();

    return (
        <>
            <Translation id={BRIDGE_SPEED_NAME_ID[bridgeSpeed]} />
            {fee !== undefined && (
                <>
                    {` · `}
                    {fee}
                </>
            )}
        </>
    );
};
