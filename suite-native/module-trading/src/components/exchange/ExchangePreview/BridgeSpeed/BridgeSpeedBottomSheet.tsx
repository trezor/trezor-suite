import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    BRIDGE_SPEED,
    type BridgeSpeed,
    type TradingRootState,
    exchangeThunks,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { BottomSheetModal, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { BridgeSpeedOptionCard } from './BridgeSpeedOptionCard';

export type BridgeSpeedBottomSheetProps = {
    isVisible: boolean;
    selectedBridgeSpeed: BridgeSpeed;
    onClose: () => void;
    onBridgeSpeedConfirmed: () => Promise<void>;
};

export const BridgeSpeedBottomSheet = memo(
    ({
        isVisible,
        selectedBridgeSpeed,
        onClose,
        onBridgeSpeedConfirmed,
    }: BridgeSpeedBottomSheetProps) => {
        const { dispatch } = useServices(injectDispatch);
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
        const [pendingSpeed, setPendingSpeed] = useState(selectedBridgeSpeed);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const quote = useSelector(selectTradingExchangeSelectedQuote);
        const coinSymbol = useSelector((state: TradingRootState) =>
            selectTradingCoinSymbolByCryptoId(state, quote?.send),
        );

        useEffect(() => {
            if (isVisible) {
                setPendingSpeed(selectedBridgeSpeed);
                openModal();
            }
        }, [isVisible, openModal, selectedBridgeSpeed]);

        const handleSelect = useCallback(
            async (bridgeSpeed: BridgeSpeed) => {
                if (bridgeSpeed === selectedBridgeSpeed) {
                    closeModal();
                    onClose();

                    return;
                }

                setPendingSpeed(bridgeSpeed);
                setIsSubmitting(true);

                try {
                    await dispatch(exchangeThunks.setBridgeSpeedThunk({ bridgeSpeed })).unwrap();
                    await onBridgeSpeedConfirmed();
                    closeModal();
                    onClose();
                } catch {
                    setPendingSpeed(selectedBridgeSpeed);
                } finally {
                    setIsSubmitting(false);
                }
            },
            [closeModal, dispatch, onBridgeSpeedConfirmed, onClose, selectedBridgeSpeed],
        );

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="moduleTrading.bridgeSpeed.title" />}
                onDismiss={onClose}
                isCloseDisplayed
                testID="@trading/exchange/bridge-speed-sheet"
            >
                <VStack spacing="sp12" paddingBottom="sp12">
                    <BridgeSpeedOptionCard
                        icon="lightning"
                        titleId="moduleTrading.bridgeSpeed.fast.title"
                        feeId="moduleTrading.bridgeSpeed.fast.fee"
                        descriptionId="moduleTrading.bridgeSpeed.fast.description"
                        coinSymbol={coinSymbol}
                        isChecked={pendingSpeed === BRIDGE_SPEED.FAST}
                        onChange={() => {
                            if (!isSubmitting) {
                                handleSelect(BRIDGE_SPEED.FAST);
                            }
                        }}
                        testID="@trading/exchange/bridge-speed-option-fast"
                    />
                    <BridgeSpeedOptionCard
                        icon="timer"
                        titleId="moduleTrading.bridgeSpeed.standard.title"
                        feeId="moduleTrading.bridgeSpeed.standard.fee"
                        descriptionId="moduleTrading.bridgeSpeed.standard.description"
                        coinSymbol={coinSymbol}
                        isChecked={pendingSpeed === BRIDGE_SPEED.STANDARD}
                        onChange={() => {
                            if (!isSubmitting) {
                                handleSelect(BRIDGE_SPEED.STANDARD);
                            }
                        }}
                        testID="@trading/exchange/bridge-speed-option-standard"
                    />
                </VStack>
            </BottomSheetModal>
        );
    },
);
