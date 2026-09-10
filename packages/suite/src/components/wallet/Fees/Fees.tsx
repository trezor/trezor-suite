import { Column } from '@trezor/components';

import { CollapsibleFees, type CollapsibleFeesProps } from './CollapsibleFees/CollapsibleFees';
import { useFetchFees } from './CollapsibleFees/hooks/useFetchFees';
import { FieldErrorBanner } from './FieldErrorBanner';

export type FeesProps = Pick<
    CollapsibleFeesProps,
    | 'account'
    | 'label'
    | 'rbfForm'
    | 'feeInfo'
    | 'changeFeeLevel'
    | 'composedLevels'
    | 'headerTypographyStyle'
    | 'isOpen'
>;

export const Fees = ({
    account,
    feeInfo,
    changeFeeLevel,
    composedLevels,
    label,
    rbfForm,
    headerTypographyStyle,
    isOpen,
}: FeesProps) => {
    useFetchFees({ networkSymbol: account.symbol });

    return (
        <Column gap={16} overflow="unset">
            <CollapsibleFees
                account={account}
                label={label}
                feeInfo={feeInfo}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
                rbfForm={rbfForm}
                headerTypographyStyle={headerTypographyStyle}
                isOpen={isOpen}
            />

            <FieldErrorBanner fieldName="selectedFee" />
        </Column>
    );
};
