import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Account } from 'src/types/wallet';

import { CollapsibleFees, CollapsibleFeesProps } from './CollapsibleFees/CollapsibleFees';
import { useFetchFees } from './CollapsibleFees/hooks/useFetchFees';
import { FieldErrorBanner } from './FieldErrorBanner';

export type FeesProps = {
    account: Pick<Account, 'symbol' | 'networkType'>;
    isHeaderRowLayout?: boolean;
} & Pick<
    CollapsibleFeesProps,
    'label' | 'rbfForm' | 'feeInfo' | 'changeFeeLevel' | 'composedLevels' | 'headerTypographyStyle'
>;

export const Fees = ({
    account: { symbol: networkSymbol, networkType },
    feeInfo,
    changeFeeLevel,
    composedLevels,
    label,
    rbfForm,
    headerTypographyStyle,
    isHeaderRowLayout,
}: FeesProps) => {
    useFetchFees({ networkSymbol });

    return (
        <Column gap={spacings.md} overflow="unset">
            <CollapsibleFees
                networkType={networkType}
                networkSymbol={networkSymbol}
                label={label}
                feeInfo={feeInfo}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
                rbfForm={rbfForm}
                headerTypographyStyle={headerTypographyStyle}
                isHeaderRowLayout={isHeaderRowLayout}
            />

            <FieldErrorBanner fieldName="selectedFee" />
        </Column>
    );
};
