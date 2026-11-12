import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingBridgeSpeed } from '@suite-common/trading';
import { Column, Icon, type IconComponent, RadioCard, Row, Text } from '@trezor/components';
import { ClockIcon, LightningIcon } from '@trezor/icons';

import { TradingExchangeBridgeSpeedLabel } from './TradingExchangeBridgeSpeedLabel';

type BridgeSpeedOptionAppearance = {
    icon: IconComponent;
    descriptionId: TranslationKey;
};

const BRIDGE_SPEED_OPTION_APPEARANCE = {
    fast: { icon: LightningIcon, descriptionId: 'TR_TRADING_BRIDGE_SPEED_FAST_DESC' },
    standard: { icon: ClockIcon, descriptionId: 'TR_TRADING_BRIDGE_SPEED_STANDARD_DESC' },
} as const satisfies Record<TradingBridgeSpeed, BridgeSpeedOptionAppearance>;

type TradingExchangeBridgeSpeedOptionProps = {
    bridgeSpeed: TradingBridgeSpeed;
    fastFeePercent?: string;
    receiveSymbol?: string;
    isSelected: boolean;
    onSelect: (bridgeSpeed: TradingBridgeSpeed) => void;
};

export const TradingExchangeBridgeSpeedOption = ({
    bridgeSpeed,
    fastFeePercent,
    receiveSymbol,
    isSelected,
    onSelect,
}: TradingExchangeBridgeSpeedOptionProps) => {
    const { icon, descriptionId } = BRIDGE_SPEED_OPTION_APPEARANCE[bridgeSpeed];

    return (
        <RadioCard
            type="raised"
            isSelected={isSelected}
            onClick={() => onSelect(bridgeSpeed)}
            dataTestId={`@trading/bridge-speed-modal/${bridgeSpeed}`}
        >
            <Column gap={4} alignItems="stretch">
                <Row alignItems="center" gap={8}>
                    <Icon as={icon} size={16} />
                    <Text typographyStyle="body-md-strong">
                        <TradingExchangeBridgeSpeedLabel
                            bridgeSpeed={bridgeSpeed}
                            fastFeePercent={fastFeePercent}
                        />
                    </Text>
                </Row>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id={descriptionId} values={{ symbol: receiveSymbol }} />
                </Text>
            </Column>
        </RadioCard>
    );
};
