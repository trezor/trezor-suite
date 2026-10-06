import { Translation } from '@suite/intl';
import { Button, Column, Row } from '@trezor/components';

import { useFeeLevels } from './useFeeLevels';
import { useFeesContext } from '../../context/FeesContext';
import { CustomFee } from '../CustomFee/CustomFee';

export type CustomFeePickerProps = {
    showCurrentFee: boolean;
};

export const CustomFeePicker = ({ showCurrentFee }: CustomFeePickerProps) => {
    const fees = useFeesContext();
    const { defaultFeeLevel } = useFeeLevels(fees);
    const { changeFeeLevel } = fees;

    return (
        <Column gap={16}>
            <Column gap={16}>
                <CustomFee showCurrentFee={showCurrentFee} />
            </Column>

            <Row justifyContent="center" margin={{ bottom: 8 }}>
                {/* allow switching to non-custom fee only when there is some */}
                {!!defaultFeeLevel && (
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => changeFeeLevel(defaultFeeLevel)}
                        data-testid="@wallet/fees/select-standard-fee"
                    >
                        <Translation id="FEE_LEVEL_STANDARD" />
                    </Button>
                )}
            </Row>
        </Column>
    );
};
