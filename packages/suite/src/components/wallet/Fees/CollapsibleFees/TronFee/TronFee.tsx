import { useWatch } from 'react-hook-form';

import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { LoadingContent } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { TronFeeContent } from './TronFeeContent';
import { useFeesContext } from '../../context/FeesContext';

type TronFeeProps = {
    typographyStyle: TypographyStyle;
};

export function TronFee({ typographyStyle }: TronFeeProps) {
    const { networkSymbol, composedLevels, tronResources } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));
    const formFeeLimit = useWatch<FormState, 'feeLimit'>({ name: 'feeLimit' });

    const tx = composedLevels?.normal;
    const estimatedFeeLimit = tx?.type !== 'error' ? tx?.estimatedFeeLimit : undefined;
    const feeLimitSun =
        formFeeLimit && estimatedFeeLimit && new BigNumber(formFeeLimit).gt(estimatedFeeLimit)
            ? formFeeLimit
            : estimatedFeeLimit;
    const fees = calculateTronFeeBreakdown(tx, tronResources, networkSymbol, feeLimitSun);

    return (
        <LoadingContent
            size={20}
            isLoading={areFeesLoading}
            data-testid="@wallet/tron-fee-loading"
            slideContent={false}
        >
            <TronFeeContent
                tx={tx}
                fees={fees}
                networkSymbol={networkSymbol}
                typographyStyle={typographyStyle}
            />
        </LoadingContent>
    );
}
