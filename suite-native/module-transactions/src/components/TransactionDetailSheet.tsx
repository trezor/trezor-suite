import { ReactNode } from 'react';

import { EventType } from '@suite-native/analytics';
import {
    BottomSheetModal,
    Box,
    Button,
    PressableOpacity,
    Text,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionDetailSheetProps = {
    iconName: IconName;
    title: string;
    transactionId: string;
    children: ReactNode;
    sheetName: SheetType;
};

type SheetType = 'parameters' | 'values' | 'inputs';

type TransactionSheetAnalyticsEventType =
    | EventType.TransactionDetailParameters
    | EventType.TransactionDetailCompareValues
    | EventType.TransactionDetailInputOutput;

const sheetToAnalyticsEventMap: Record<SheetType, TransactionSheetAnalyticsEventType> = {
    parameters: EventType.TransactionDetailParameters,
    values: EventType.TransactionDetailCompareValues,
    inputs: EventType.TransactionDetailInputOutput,
};

const triggerStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const BottomSheetTrigger = ({
    iconName,
    title,
    onPress,
}: {
    iconName: IconName;
    title: string;
    onPress: () => void;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity style={applyStyle(triggerStyle)} onPress={onPress}>
            <Box flexDirection="row" alignItems="center">
                <Box marginRight="sp16">
                    <Icon name={iconName} color="iconDefault" size="mediumLarge" />
                </Box>
                <Text>{title}</Text>
            </Box>
            <Icon name="caretRight" color="iconSubdued" size="mediumLarge" />
        </PressableOpacity>
    );
};

export const TransactionDetailSheet = ({
    iconName,
    title,
    transactionId,
    children,
    sheetName,
}: TransactionDetailSheetProps) => {
    const analytics = useAnalytics();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const openSheet = () => {
        analytics.report({ type: sheetToAnalyticsEventMap[sheetName] });
        openModal();
    };

    return (
        <Box>
            <BottomSheetTrigger iconName={iconName} title={title} onPress={openSheet} />
            <BottomSheetModal
                ref={bottomSheetRef}
                title={title}
                subtitle={
                    <Translation
                        id="transactions.TransactionDetailScreen.sheetSubtitle"
                        values={{ transactionId }}
                    />
                }
                isCloseDisplayed
            >
                <Box paddingTop="sp24">
                    {children}
                    <Box paddingHorizontal="sp8" marginTop="sp24">
                        <Button size="large" onPress={closeModal}>
                            <Translation id="generic.buttons.close" />
                        </Button>
                    </Box>
                </Box>
            </BottomSheetModal>
        </Box>
    );
};
