import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { EventType, analytics } from '@suite-native/analytics';
import { BottomSheetModal, Box, Button, Text, useBottomSheetModal } from '@suite-native/atoms/src';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles/src';

type TransactionDetailSheetProps = {
    iconName: IconName;
    title: string;
    transactionId: string;
    children: ReactNode;
    sheetName: SheetType;
};

type SheetType = 'parameters' | 'values' | 'inputs';

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
        <TouchableOpacity style={applyStyle(triggerStyle)} onPress={onPress}>
            <Box flexDirection="row" alignItems="center">
                <Box marginRight="sp16">
                    <Icon name={iconName} color="iconDefault" size="mediumLarge" />
                </Box>
                <Text>{title}</Text>
            </Box>
            <Icon name="caretRight" color="iconSubdued" size="mediumLarge" />
        </TouchableOpacity>
    );
};

export const TransactionDetailSheetNew = ({
    iconName,
    title,
    transactionId,
    children,
    sheetName,
}: TransactionDetailSheetProps) => {
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
                subtitle={`Transaction #${transactionId}`}
            >
                <Box paddingTop="sp24">
                    {children}
                    <Box paddingHorizontal="sp8" marginTop="sp24">
                        <Button size="large" onPress={closeModal}>
                            Close
                        </Button>
                    </Box>
                </Box>
            </BottomSheetModal>
        </Box>
    );
};
