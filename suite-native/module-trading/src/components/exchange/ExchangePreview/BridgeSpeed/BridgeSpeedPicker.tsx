import { useSelector } from 'react-redux';

import {
    BRIDGE_SPEED,
    type BridgeSpeed,
    isCctpBridgeProvider,
    selectTradingExchangeBridgeSpeed,
} from '@suite-common/trading';
import { HStack, Text, useBottomSheetControls } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { BridgeSpeedBottomSheet } from './BridgeSpeedBottomSheet';

export const BRIDGE_SPEED_PICKER_TEST_ID = '@trading/exchange/bridge-speed-picker';

type BridgeSpeedPickerProps = {
    providerId: string | undefined;
    onBridgeSpeedConfirmed: () => Promise<void>;
};

const bridgeSpeedPickerStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp56,
}));

const getBridgeSpeedTranslationIds = (bridgeSpeed: BridgeSpeed) => {
    if (bridgeSpeed === BRIDGE_SPEED.FAST) {
        return {
            titleId: 'moduleTrading.bridgeSpeed.fast.title',
            feeId: 'moduleTrading.bridgeSpeed.fast.fee',
        } as const;
    }

    return {
        titleId: 'moduleTrading.bridgeSpeed.standard.title',
        feeId: 'moduleTrading.bridgeSpeed.standard.fee',
    } as const;
};

export const BridgeSpeedPicker = ({
    providerId,
    onBridgeSpeedConfirmed,
}: BridgeSpeedPickerProps) => {
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();
    const bridgeSpeed = useSelector(selectTradingExchangeBridgeSpeed);
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    if (!isCctpBridgeProvider(providerId)) {
        return null;
    }

    const { titleId, feeId } = getBridgeSpeedTranslationIds(bridgeSpeed);
    const summary = translate('moduleTrading.bridgeSpeed.summary', {
        title: translate(titleId),
        fee: translate(feeId),
    });

    return (
        <>
            <TradeInfoRow
                onPress={showSheet}
                testID={BRIDGE_SPEED_PICKER_TEST_ID}
                style={applyStyle(bridgeSpeedPickerStyle)}
            >
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="moduleTrading.bridgeSpeed.label" />
                </Text>
                <HStack alignItems="center" spacing="sp4">
                    <Text variant="body-sm" color="contentPrimary">
                        {summary}
                    </Text>
                    <Icon name="caretDown" size="medium" color="contentSecondary" />
                </HStack>
            </TradeInfoRow>
            <BridgeSpeedBottomSheet
                isVisible={isSheetVisible}
                selectedBridgeSpeed={bridgeSpeed}
                onClose={hideSheet}
                onBridgeSpeedConfirmed={onBridgeSpeedConfirmed}
            />
        </>
    );
};
