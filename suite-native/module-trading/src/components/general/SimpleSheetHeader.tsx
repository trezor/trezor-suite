import { ReactNode } from 'react';

import { BottomSheetGrabber, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SheetHeaderTitle } from './SheetHeaderTitle';

export type SimpleSheetHeaderProps = {
    onClose: () => void;
    title: ReactNode;
};

export const ESTIMATED_HEADER_HEIGHT = 110;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp16,
    gap: spacings.sp16,
}));

export const SimpleSheetHeader = ({ onClose, title }: SimpleSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <VStack style={applyStyle(wrapperStyle)}>
            <BottomSheetGrabber />
            <SheetHeaderTitle
                leftButtonIcon="x"
                onLeftButtonPress={onClose}
                leftButtonA11yLabel={translate('generic.buttons.close')}
            >
                {title}
            </SheetHeaderTitle>
        </VStack>
    );
};
