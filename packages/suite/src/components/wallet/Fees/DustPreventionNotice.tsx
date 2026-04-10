import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { Note } from '@trezor/components';
import { isApproximatelyEqual } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { useFeesContext } from './context/FeesContext';

type DustPreventionNoticeProps = {
    chosenFeePerByte: string | undefined;
    composedFeePerByte: string | undefined;
    feeUnits: string;
};

export const DustPreventionNotice = ({
    chosenFeePerByte,
    composedFeePerByte,
    feeUnits,
}: DustPreventionNoticeProps) => {
    const { networkSymbol } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));
    const baseFee = useWatch<FormState, 'baseFee'>({ name: 'baseFee' });

    const relativeTolerance = 1e-3;
    const isComposedFeeRateDifferent =
        !areFeesLoading &&
        composedFeePerByte !== undefined &&
        chosenFeePerByte !== undefined &&
        !isApproximatelyEqual(composedFeePerByte, chosenFeePerByte, relativeTolerance);

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
