import { useFetchFees } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { CollapsibleFees, type CollapsibleFeesProps } from './CollapsibleFees/CollapsibleFees';
import { useIsFeeRefetchDisabled } from './CollapsibleFees/hooks/useIsFeeRefetchDisabled';
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
    const isRefetchDisabled = useIsFeeRefetchDisabled();
    useFetchFees({ networkSymbol: account.symbol, isRefetchDisabled });

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
