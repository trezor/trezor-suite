import { BottomSheetGrabber, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SearchableSheetHeader } from '../SearchableSheetHeader';
import { SheetHeaderTitle } from '../SheetHeaderTitle';

export type AccountSheetHeaderProps = {
    onClose: () => void;
    selectedAccountLabel: string | undefined;
    clearSelectedAccount: () => void;
};

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp16,
    gap: spacings.sp16,
}));

export const AccountSheetHeader = ({
    selectedAccountLabel,
    clearSelectedAccount,
    onClose,
}: AccountSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    if (selectedAccountLabel) {
        return (
            <SearchableSheetHeader
                onClose={clearSelectedAccount}
                title={selectedAccountLabel}
                rightButtonIcon="caretLeft"
                rightButtonA11yLabel={translate('generic.buttons.back')}
            />
        );
    }

    return (
        <VStack style={applyStyle(wrapperStyle)}>
            <BottomSheetGrabber />
            <SheetHeaderTitle
                rightButtonIcon="x"
                onRightButtonPress={onClose}
                rightButtonA11yLabel={translate('generic.buttons.close')}
            >
                <Translation id="moduleTrading.accountScreen.titleStep1" />
            </SheetHeaderTitle>
        </VStack>
    );
};
