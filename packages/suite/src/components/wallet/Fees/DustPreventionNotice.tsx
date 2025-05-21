import { Note } from '@trezor/components';

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
    const isComposedFeeRateDifferent =
        composedFeePerByte !== undefined &&
        composedFeePerByte !== '' &&
        chosenFeePerByte !== composedFeePerByte;

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
