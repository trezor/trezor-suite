import { type ReactNode, type Ref } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import {
    type BottomSheetControlProps,
    ConfirmOnTrezorWrapper,
} from '@suite-native/confirm-on-trezor';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { ScrollToEndOnMount } from '@suite-native/scrollview';

type YieldReviewScreenLayoutProps = {
    children: ReactNode;
    confirmOnTrezorRef: Ref<BottomSheetControlProps>;
    submitButton?: ReactNode;
    titleTranslationId: TxKeyPath;
};

export const YieldReviewScreenLayout = ({
    children,
    confirmOnTrezorRef,
    submitButton,
    titleTranslationId,
}: YieldReviewScreenLayoutProps) => (
    <ConfirmOnTrezorWrapper
        isManualControlEnabled
        controlRef={confirmOnTrezorRef}
        closeActionType="back"
        defaultHeader={
            <ScreenHeader
                closeActionType="back"
                customContent={
                    <Text variant="body-md-strong">
                        <Translation id={titleTranslationId} />
                    </Text>
                }
            />
        }
    >
        <VStack flex={1} justifyContent="space-between">
            {children}
            {!!submitButton && <ScrollToEndOnMount>{submitButton}</ScrollToEndOnMount>}
        </VStack>
    </ConfirmOnTrezorWrapper>
);
