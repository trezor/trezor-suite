import { useState } from 'react';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { type TradingBridgeSpeed } from '@suite-common/trading';
import { InfoItem, Text, TextButton, Tooltip } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

import { TradingExchangeBridgeSpeedLabel } from 'src/views/wallet/trading/exchange/TradingExchangeBridgeSpeedModal/TradingExchangeBridgeSpeedLabel';
import { TradingExchangeBridgeSpeedModal } from 'src/views/wallet/trading/exchange/TradingExchangeBridgeSpeedModal/TradingExchangeBridgeSpeedModal';

type TradingExchangeBridgeSpeedInfoItemProps = {
    isEditable?: boolean;
    bridgeSpeed: TradingBridgeSpeed;
    fastFeePercent?: string;
    receiveSymbol?: string;
    selectedQuote?: ExchangeTrade;
};

export const TradingExchangeBridgeSpeedInfoItem = ({
    isEditable = false,
    bridgeSpeed,
    fastFeePercent,
    receiveSymbol,
    selectedQuote,
}: TradingExchangeBridgeSpeedInfoItemProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const value = (
        <TradingExchangeBridgeSpeedLabel
            bridgeSpeed={bridgeSpeed}
            fastFeePercent={fastFeePercent}
        />
    );

    return (
        <>
            <InfoItem
                label={
                    <Tooltip content={<Translation id="TR_TRADING_BRIDGE_SPEED_INFO" />} hasIcon>
                        <Translation id="TR_TRADING_BRIDGE_SPEED" />
                    </Tooltip>
                }
                direction="row"
            >
                {isEditable ? (
                    <TextButton
                        onClick={() => setIsEditModalOpen(true)}
                        size="small"
                        iconRight={PencilSimpleIcon}
                        intent="brand"
                        isUnderlined
                        data-testid="@trading/offer/info/bridge-speed"
                    >
                        {value}
                    </TextButton>
                ) : (
                    <Text typographyStyle="body-sm" data-testid="@trading/offer/info/bridge-speed">
                        {value}
                    </Text>
                )}
            </InfoItem>

            {isEditModalOpen && selectedQuote && (
                <TradingExchangeBridgeSpeedModal
                    selectedQuote={selectedQuote}
                    bridgeSpeed={bridgeSpeed}
                    fastFeePercent={fastFeePercent}
                    receiveSymbol={receiveSymbol}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
};
