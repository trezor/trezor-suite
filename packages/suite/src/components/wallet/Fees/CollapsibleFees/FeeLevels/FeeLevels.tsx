import { Translation } from '@suite/intl';
import { Button, Column, Row, TextButton } from '@trezor/components';

import { useFeeLevels } from './useFeeLevels';
import { useFeesContext } from '../../context/FeesContext';
import { CustomFee } from '../CustomFee/CustomFee';
import { CustomFeeTron } from '../CustomFee/CustomFeeTron';
import { StandardFee, type StandardFeeProps } from '../StandardFee/StandardFee';

export type FeeLevelsProps = {
    showCurrentFee: boolean;
} & Pick<StandardFeeProps, 'feeCardAppearance'>;

export const FeeLevels = ({ showCurrentFee, feeCardAppearance }: FeeLevelsProps) => {
    const fees = useFeesContext();
    const { isTrc20Transfer, isCustomFee, defaultFeeLevel } = useFeeLevels(fees);
    const { changeFeeLevel, selectedFeeLevel } = fees;

    if (isTrc20Transfer) {
        return (
            <Column gap={16}>
                <CustomFeeTron />
            </Column>
        );
    }

    return (
        <Column gap={16}>
            <Column gap={16}>
                {!isCustomFee && <StandardFee feeCardAppearance={feeCardAppearance} />}
                {isCustomFee && <CustomFee showCurrentFee={showCurrentFee} />}
            </Column>

            <Row justifyContent="center" margin={{ bottom: 8 }}>
                {/* allow switching to non-custom fee only when there is some */}
                {isCustomFee && !!defaultFeeLevel && (
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => changeFeeLevel(defaultFeeLevel)}
                        data-testid="@wallet/fees/select-standard-fee"
                    >
                        <Translation id="FEE_LEVEL_STANDARD" />
                    </Button>
                )}
                {/* in order to have sensible default for custom fee, selected fee level must exist (see useFees hook) */}
                {!isCustomFee && !!selectedFeeLevel && (
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
