import { Translation } from '@suite/intl';
import { Column, Row, TextButton } from '@trezor/components';

import { useFeesContext } from '../../context/FeesContext';
import { StandardFee, type StandardFeeProps } from '../StandardFee/StandardFee';

export type StandardFeePickerProps = Pick<StandardFeeProps, 'feeCardAppearance'>;

export const StandardFeePicker = ({ feeCardAppearance }: StandardFeePickerProps) => {
    const { changeFeeLevel, selectedFeeLevel } = useFeesContext();

    return (
        <Column gap={16}>
            <StandardFee feeCardAppearance={feeCardAppearance} />

            <Row justifyContent="center" margin={{ bottom: 8 }}>
                {/* in order to have sensible default for custom fee, selected fee level must exist (see useFees hook) */}
                {!!selectedFeeLevel && (
                    <TextButton
                        onClick={() => changeFeeLevel('custom')}
                        data-testid="@wallet/fees/select-custom-fee"
                        intent="neutral"
                        size="small"
                        isUnderlined
                    >
                        <Translation id="FEE_LEVEL_ADVANCED" />
                    </TextButton>
                )}
            </Row>
        </Column>
    );
};
