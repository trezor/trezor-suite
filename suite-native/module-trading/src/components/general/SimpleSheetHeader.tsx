import { type PropsWithChildren, type ReactNode } from 'react';

import { BottomSheetGrabber, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { SheetHeaderTitle } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type SimpleSheetHeaderProps = {
    onClose: () => void;
    title: ReactNode;
};

export const ESTIMATED_HEADER_HEIGHT = 110;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp16,
    gap: spacings.sp16,
}));

export const SimpleSheetHeader = ({
    onClose,
    title,
    children,
}: PropsWithChildren<SimpleSheetHeaderProps>) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <VStack style={applyStyle(wrapperStyle)}>
            <BottomSheetGrabber />
            <SheetHeaderTitle
                rightButtonIcon="x"
                onRightButtonPress={onClose}
                rightButtonA11yLabel={translate('generic.buttons.close')}
            >
                {title}
            </SheetHeaderTitle>
            {children}
        </VStack>
    );
};
