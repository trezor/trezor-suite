import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { Note } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useFeesContext } from './context/FeesContext';

type DustPreventionNoticeProps = {
    chosenFeePerByte: string | undefined;
    composedFeePerByte: string | undefined;
    feeUnits: string;
};

// Absolute threshold for fee rate comparison. Sub-0.1 adjustments (e.g. sat/vB)
// are not actionable for the user and only add noise.
const FEE_RATE_DIFFERENCE_THRESHOLD = 0.1;

export const DustPreventionNotice = ({
    chosenFeePerByte,
    composedFeePerByte,
    feeUnits,
}: DustPreventionNoticeProps) => {
    const { networkSymbol } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));
    const baseFee = useWatch<FormState, 'baseFee'>({ name: 'baseFee' });

    const isComposedFeeRateDifferent =
        !areFeesLoading &&
        composedFeePerByte !== undefined &&
        chosenFeePerByte !== undefined &&
        new BigNumber(composedFeePerByte)
            .minus(chosenFeePerByte)
            .abs()
            .gte(FEE_RATE_DIFFERENCE_THRESHOLD);

    if (!isComposedFeeRateDifferent) return null;

    return (
        <Note data-testid="@wallet/fees/dust-prevention-notice">
            <Translation
                id={
                    baseFee !== undefined
                        ? 'TR_FEE_ROUNDING_BASEFEE_WARNING'
                        : 'TR_FEE_ROUNDING_DEFAULT_WARNING'
                }
                values={{
                    feeRate: (
                        <>
                            <strong>{composedFeePerByte}</strong> {feeUnits}
                        </>
                    ),
                }}
            />
        </Note>
    );
};
