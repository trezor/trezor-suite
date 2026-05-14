import { type ReactNode } from 'react';

import { events } from '@suite-native/analytics';
import {
    BottomSheetModal,
    Box,
    Button,
    PressableOpacity,
    Text,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type SheetControls = ReturnType<typeof useBottomSheetModal>;

type TransactionDetailSheetProps = {
    iconName: IconName;
    title: string;
    transactionId: string;
    children: ReactNode;
    sheetName: SheetType;
    sheetControls?: SheetControls;
};

type SheetType = 'parameters' | 'values' | 'inputs';

const sheetToAnalyticsEventMap = {
    parameters: events.transactionDetailParametersEvent.name,
    values: events.transactionDetailCompareValuesEvent.name,
    inputs: events.transactionDetailInputOutputEvent.name,
} as const satisfies Record<SheetType, string>;

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
                    <Icon name={iconName} color="contentPrimary" size="mediumLarge" />
                </Box>
                <Text>{title}</Text>
            </Box>
            <Icon name="caretRight" color="contentSecondary" size="mediumLarge" />
        </PressableOpacity>
    );
};

export const TransactionDetailSheet = ({
    iconName,
    title,
    transactionId,
    children,
    sheetName,
    sheetControls,
}: TransactionDetailSheetProps) => {
    const analytics = useAnalytics();
    const internal = useBottomSheetModal();
    const { bottomSheetRef, openModal, closeModal } = sheetControls ?? internal;

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
                        <Button onPress={closeModal}>
                            <Translation id="generic.buttons.close" />
                        </Button>
                    </Box>
                </Box>
            </BottomSheetModal>
        </Box>
    );
};
