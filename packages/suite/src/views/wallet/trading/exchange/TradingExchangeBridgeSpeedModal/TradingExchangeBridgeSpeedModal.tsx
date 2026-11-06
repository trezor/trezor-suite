import { useState } from 'react';

import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    TRADING_BRIDGE_SPEEDS,
    type TradingBridgeSpeed,
    selectTradingExchangeReceiveAddress,
    withTradeBridgeSpeed,
} from '@suite-common/trading';
import { Banner, Column, Modal } from '@trezor/components';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';

import { TradingExchangeBridgeSpeedOption } from './TradingExchangeBridgeSpeedOption';

type TradingExchangeBridgeSpeedModalProps = {
    selectedQuote: ExchangeTrade;
    bridgeSpeed: TradingBridgeSpeed;
    fastFeePercent?: string;
    receiveSymbol?: string;
    onClose: () => void;
};

export const TradingExchangeBridgeSpeedModal = ({
    selectedQuote,
    bridgeSpeed: currentBridgeSpeed,
    fastFeePercent,
    receiveSymbol,
    onClose,
}: TradingExchangeBridgeSpeedModalProps) => {
    const persistedReceiveAddress = useSelector(selectTradingExchangeReceiveAddress);
    const [bridgeSpeed, setBridgeSpeed] = useState<TradingBridgeSpeed>(currentBridgeSpeed);
    const [hasSubmitError, setHasSubmitError] = useState(false);
    const { handleClick, disabled: isSubmitting } = useAsyncClickHandler();
    const { confirmTrade } = useTradingExchangeTradeActions();

    const onConfirm = async () => {
        if (bridgeSpeed === currentBridgeSpeed) {
            onClose();

            return;
        }

        const receiveAddress = selectedQuote.receiveAddress ?? persistedReceiveAddress;

        if (!receiveAddress) {
            setHasSubmitError(true);

            return;
        }
        setHasSubmitError(false);

        try {
            const result = await confirmTrade({
                receiveAddress,
                trade: withTradeBridgeSpeed({ trade: selectedQuote, bridgeSpeed }),
            });

            if (result) {
                onClose();
            }
        } catch {
            setHasSubmitError(true);
        }
    };

    const onCloseModal = () => {
        if (isSubmitting) {
            return;
        }
        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_TRADING_BRIDGE_SPEED" />}
            onCancel={onCloseModal}
            width={400}
            bottomContent={
                <>
                    <Modal.Button
                        isLoading={isSubmitting}
                        isDisabled={isSubmitting}
                        onClick={() => handleClick(onConfirm)}
                        data-testid="@trading/bridge-speed-modal/confirm"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isSubmitting}
                        onClick={onCloseModal}
                        data-testid="@trading/bridge-speed-modal/cancel"
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={8}>
                {TRADING_BRIDGE_SPEEDS.map(speed => (
                    <TradingExchangeBridgeSpeedOption
                        key={speed}
                        bridgeSpeed={speed}
                        fastFeePercent={fastFeePercent}
                        receiveSymbol={receiveSymbol}
                        isSelected={speed === bridgeSpeed}
                        onSelect={setBridgeSpeed}
                    />
                ))}

                {hasSubmitError && (
                    <Banner
                        intent="critical"
                        icon
                        data-testid="@trading/bridge-speed-modal/error"
                        description={<Translation id="TR_TRADING_BRIDGE_SPEED_ERROR" />}
                    />
                )}
            </Column>
        </Modal>
    );
};
