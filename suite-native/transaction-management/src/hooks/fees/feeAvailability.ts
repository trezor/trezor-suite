import type { FeeLevelLabel, GeneralPrecomposedLevels } from '@suite-common/wallet-types';

export type GetFeeAvailabilityParams = {
    feeLevels: GeneralPrecomposedLevels;
    selectedFee: FeeLevelLabel | undefined;
    isLoading: boolean;
};

export type FeeAvailability = {
    isFeeUnavailable: boolean;
    feeError: string | null;
};

export const getFeeAvailability = ({
    feeLevels,
    selectedFee,
    isLoading,
}: GetFeeAvailabilityParams): FeeAvailability => {
    const selectedFeeLevel = selectedFee ? feeLevels[selectedFee] : undefined;
    const effectiveFeeLevel = selectedFeeLevel ?? feeLevels.normal;
    const feeError =
        !isLoading && effectiveFeeLevel?.type === 'error' ? effectiveFeeLevel.error : null;

    return { isFeeUnavailable: feeError !== null, feeError };
};
