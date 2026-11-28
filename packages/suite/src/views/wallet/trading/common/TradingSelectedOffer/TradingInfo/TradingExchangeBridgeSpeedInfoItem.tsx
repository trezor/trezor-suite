import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import {
    type TradingBridgeSpeed,
    type TradingBridgeSpeedOption,
    useTradingUtils,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { InfoItem, Skeleton, Text, TextButton } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

import { useTradingExchangeTradeActions } from '#src/hooks/wallet/trading/useTradingExchangeTradeActions';
import { TradingExchangeBridgeSpeedFee } from '#src/views/wallet/trading/exchange/TradingExchangeBridgeSpeedModal/TradingExchangeBridgeSpeedFee';
import { TradingExchangeBridgeSpeedModal } from '#src/views/wallet/trading/exchange/TradingExchangeBridgeSpeedModal/TradingExchangeBridgeSpeedModal';
import { BRIDGE_SPEED_OPTIONS } from '#src/views/wallet/trading/exchange/TradingExchangeBridgeSpeedModal/bridgeSpeedOptions';

type TradingExchangeBridgeSpeedInfoItemProps = {
    isEditable?: boolean;
    isLoading?: boolean;
    bridgeSpeed: TradingBridgeSpeed;
    bridgeSpeedOptions: TradingBridgeSpeedOption[];
    sendCryptoId: CryptoId | undefined;
    receiveCryptoId: CryptoId | undefined;
};

export const TradingExchangeBridgeSpeedInfoItem = ({
    isEditable = false,
    isLoading = false,
    bridgeSpeed,
    bridgeSpeedOptions,
    sendCryptoId,
    receiveCryptoId,
}: TradingExchangeBridgeSpeedInfoItemProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const shouldAnimateSkeleton = useSelector(selectShouldAnimateLoadingSkeleton);
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { changeBridgeSpeed } = useTradingExchangeTradeActions();

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receiveCryptoId);
    const receiveSymbol = coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : undefined;
    const hasChoice = isEditable && bridgeSpeedOptions.length > 1;
    const selectedOption = bridgeSpeedOptions.find(({ speed }) => speed === bridgeSpeed);

    const onSelect = (selectedBridgeSpeed: TradingBridgeSpeed) => {
        setIsEditModalOpen(false);

        if (selectedBridgeSpeed !== bridgeSpeed) {
            changeBridgeSpeed(selectedBridgeSpeed);
        }
    };

    const value = (
        <>
            <Translation id={BRIDGE_SPEED_OPTIONS[bridgeSpeed].nameId} />
            {selectedOption && (
                <>
                    {' · '}
                    <TradingExchangeBridgeSpeedFee feePercent={selectedOption.feePercent} />
                </>
            )}
        </>
    );

    const renderValue = () => {
        if (isLoading) {
            return <Skeleton width={60} height={16} animate={shouldAnimateSkeleton} />;
        }

        if (hasChoice) {
            return (
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
            );
        }

        return (
            <Text typographyStyle="body-sm" data-testid="@trading/offer/info/bridge-speed">
                {value}
            </Text>
        );
    };

    return (
        <>
            <InfoItem label={<Translation id="TR_TRADING_BRIDGE_SPEED" />} direction="row">
                {renderValue()}
            </InfoItem>

            {isEditModalOpen && (
                <TradingExchangeBridgeSpeedModal
                    bridgeSpeed={bridgeSpeed}
                    bridgeSpeedOptions={bridgeSpeedOptions}
                    sendCryptoId={sendCryptoId}
                    receiveSymbol={receiveSymbol}
                    onSelect={onSelect}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
};
