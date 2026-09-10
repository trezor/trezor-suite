import { type ReactNode, type Ref } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import {
    BottomSheetModal,
    Button,
    IconListItem,
    Text,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { TREZOR_SUITE_TOS_URL, TREZOR_SUPPORT_UNDERSTANDING_FEES } from '@trezor/urls';

type ListItemProps = {
    icon: IconName;
    children: ReactNode;
    href?: string;
};

const ListItem = ({ icon, children, href }: ListItemProps) => {
    const openLink = useOpenLink();

    return (
        <IconListItem icon={icon} variant="brand" iconSize="large">
            {href ? (
                <TextButton iconRight="arrowSquareOut" isUnderlined onPress={() => openLink(href)}>
                    {children}
                </TextButton>
            ) : (
                <Text>{children}</Text>
            )}
        </IconListItem>
    );
};

type HowTradingWorksSheetProps = {
    ref: Ref<BottomSheetModalMethods>;
    closeModal: () => void;
};

export const HowTradingWorksSheet = ({ ref, closeModal }: HowTradingWorksSheetProps) => (
    <BottomSheetModal
        ref={ref}
        isCloseDisplayed
        title={
            <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.sheetTitle" />
        }
    >
        <VStack spacing="sp24">
            <VStack spacing="sp16">
                <ListItem icon="piggyBank">
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item1" />
                </ListItem>
                <ListItem icon="mapPin">
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item2" />
                </ListItem>
                <ListItem icon="identificationCard">
                    <Translation
                        id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item3"
                        values={{
                            text: chunks => (
                                <Text variant="body-sm" color="contentSecondary">
                                    {chunks}
                                </Text>
                            ),
                        }}
                    />
                </ListItem>
                <ListItem icon="percent" href={TREZOR_SUPPORT_UNDERSTANDING_FEES}>
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item4" />
                </ListItem>
                <ListItem icon="scroll" href={TREZOR_SUITE_TOS_URL}>
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item5" />
                </ListItem>
            </VStack>
            <Button onPress={closeModal}>
                <Translation id="generic.buttons.gotIt" />
            </Button>
        </VStack>
    </BottomSheetModal>
);
