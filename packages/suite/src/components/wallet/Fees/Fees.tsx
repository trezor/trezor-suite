import { Column } from '@trezor/components';

import { type Account } from 'src/types/wallet';

import { CollapsibleFees, type CollapsibleFeesProps } from './CollapsibleFees/CollapsibleFees';
import { useFetchFees } from './CollapsibleFees/hooks/useFetchFees';
import { FieldErrorBanner } from './FieldErrorBanner';

export type FeesProps = {
    account: Pick<Account, 'symbol' | 'networkType'>;
} & Pick<
    CollapsibleFeesProps,
    | 'label'
    | 'rbfForm'
    | 'feeInfo'
    | 'changeFeeLevel'
    | 'composedLevels'
    | 'headerTypographyStyle'
    | 'isOpen'
>;

export const Fees = ({
    account: { symbol: networkSymbol, networkType },
    feeInfo,
    changeFeeLevel,
    composedLevels,
    label,
    rbfForm,
    headerTypographyStyle,
    isOpen,
}: FeesProps) => {
    useFetchFees({ networkSymbol });

    return (
        <Column gap={16} overflow="unset">
            <CollapsibleFees
                networkType={networkType}
                networkSymbol={networkSymbol}
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
