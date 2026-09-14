import { type ReactNode, type Ref } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import {
    BottomSheetModal,
    Button,
    IconList,
    IconListItem,
    IconListTextItem,
    Text,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { TREZOR_SUITE_TOS_URL, TREZOR_SUPPORT_UNDERSTANDING_FEES } from '@trezor/urls';

type IconListTextButtonItemProps = {
    icon: IconName;
    href: string;
    children: ReactNode;
};

const IconListTextButtonItem = ({ icon, href, children }: IconListTextButtonItemProps) => {
    const openLink = useOpenLink();

    return (
        <IconListItem icon={icon}>
            <TextButton iconRight="arrowSquareOut" isUnderlined onPress={() => openLink(href)}>
                {children}
            </TextButton>
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
            <IconList iconIntent="brand" textVariant="body-md">
                <IconListTextItem icon="piggyBank">
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item1" />
                </IconListTextItem>
                <IconListTextItem icon="mapPin">
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item2" />
                </IconListTextItem>
                <IconListTextItem icon="identificationCard">
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
                </IconListTextItem>
                <IconListTextButtonItem icon="percent" href={TREZOR_SUPPORT_UNDERSTANDING_FEES}>
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item4" />
                </IconListTextButtonItem>
                <IconListTextButtonItem icon="scroll" href={TREZOR_SUITE_TOS_URL}>
                    <Translation id="moduleTrading.tradingScreen.footer.howTradingWorksSheet.item5" />
                </IconListTextButtonItem>
            </IconList>
            <Button onPress={closeModal}>
                <Translation id="generic.buttons.gotIt" />
            </Button>
        </VStack>
    </BottomSheetModal>
);
