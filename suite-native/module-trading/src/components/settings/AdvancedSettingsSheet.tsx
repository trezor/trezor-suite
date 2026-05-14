import { forwardRef } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { MaxSlippageForm } from './MaxSlippageForm';

type AdvancedSettingsSheetProps = {
    closeModal: () => void;
};

export const AdvancedSettingsSheet = forwardRef<
    BottomSheetModalMethods,
    AdvancedSettingsSheetProps
>(({ closeModal }, ref) => (
    <BottomSheetModal
        ref={ref}
        title={<Translation id="moduleTrading.advancedSettings.slippage.title" />}
        isCloseDisplayed
    >
        <MaxSlippageForm onSubmit={closeModal} />
    </BottomSheetModal>
));
