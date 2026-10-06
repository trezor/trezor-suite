import { Column } from '@trezor/components';

import { CustomFeePicker } from './CustomFeePicker';
import { StandardFeePicker, type StandardFeePickerProps } from './StandardFeePicker';
import { useFeeLevels } from './useFeeLevels';
import { useFeesContext } from '../../context/FeesContext';
import { CustomFeeTron } from '../CustomFee/CustomFeeTron';

export type FeeLevelsProps = {
    showCurrentFee: boolean;
} & Pick<StandardFeePickerProps, 'feeCardAppearance'>;

export const FeeLevels = ({ showCurrentFee, feeCardAppearance }: FeeLevelsProps) => {
    const fees = useFeesContext();
    const { isTrc20Transfer, isCustomFee } = useFeeLevels(fees);

    if (isTrc20Transfer) {
        return (
            <Column gap={16}>
                <CustomFeeTron />
            </Column>
        );
    }

    return isCustomFee ? (
        <CustomFeePicker showCurrentFee={showCurrentFee} />
    ) : (
        <StandardFeePicker feeCardAppearance={feeCardAppearance} />
    );
};
