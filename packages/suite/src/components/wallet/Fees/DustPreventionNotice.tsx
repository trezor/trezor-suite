import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { Note } from '@trezor/components';
import { isApproxEqual } from '@trezor/utils';

import { useSelector } from '../../../hooks/suite';
import { Translation } from '../../suite';

type DustPreventionNoticeProps = {
    chosenFeePerByte: string | undefined;
    composedFeePerByte: string | undefined;
    baseFee: number | undefined;
    feeUnits: string;
};

export const DustPreventionNotice = ({
    chosenFeePerByte,
    composedFeePerByte,
    baseFee,
    feeUnits,
}: DustPreventionNoticeProps) => {
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state));

    const relativeTolerance = 1e-3;
    const isComposedFeeRateDifferent =
        !areFeesLoading &&
        composedFeePerByte !== undefined &&
        chosenFeePerByte !== undefined &&
        !isApproxEqual(composedFeePerByte, chosenFeePerByte, relativeTolerance);

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
