import { type ReactNode } from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalProps,
    type BottomSheetModalRef,
    Box,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

type EarnRateBreakdownBottomSheetProps = Pick<
    BottomSheetModalProps,
    'title' | 'onClose' | 'onDismiss' | 'bottomSheetCustomProps'
> & {
    ref: BottomSheetModalRef;
    children: ReactNode;
    footer: ReactNode;
    testID?: string;
};

export const EarnRateBreakdownBottomSheet = ({
    children,
    footer,
    testID,
    ...sheetProps
}: EarnRateBreakdownBottomSheetProps) => (
    <BottomSheetModal {...sheetProps} isCloseDisplayed>
        <Box testID={testID}>
            <VStack spacing="sp20">
                {children}
                <HStack spacing="sp8" alignItems="center">
                    <Icon name="arrowsDownUp" size="medium" color="contentSecondary" />
                    <Text variant="body-md" color="contentSecondary">
                        {footer}
                    </Text>
                </HStack>
            </VStack>
        </Box>
    </BottomSheetModal>
);
