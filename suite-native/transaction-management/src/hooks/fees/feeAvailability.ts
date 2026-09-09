import {
    type FeeInfo,
    type FeeLevelLabel,
    type FeesStatus,
    type GeneralPrecomposedLevels,
} from '@suite-common/wallet-types';

type IsNetworkFeeUnavailableParams = {
    feeInfo: FeeInfo | undefined;
    feeStatus: FeesStatus | null;
};

export const isNetworkFeeUnavailable = ({
    feeInfo,
    feeStatus,
}: IsNetworkFeeUnavailableParams): boolean => feeStatus === 'error' && feeInfo === undefined;

export type GetFeeAvailabilityParams = {
    fee: string | null | undefined;
    feeLevels: GeneralPrecomposedLevels;
    selectedFee: FeeLevelLabel | undefined;
    isLoading: boolean;
};

export type FeeAvailability = {
    isFeeUnavailable: boolean;
    feeError: string | null;
};

export const getFeeAvailability = ({
    fee,
    feeLevels,
    selectedFee,
    isLoading,
}: GetFeeAvailabilityParams): FeeAvailability => {
    const selectedFeeLevel = selectedFee ? feeLevels[selectedFee] : undefined;
    // TODO: default fallback, will be replaced after Fee Selector refactoring
    const normalFeeLevel = feeLevels.normal;
    const selectedFeeError = selectedFeeLevel?.type === 'error' ? selectedFeeLevel.error : null;
    const normalFeeError = normalFeeLevel?.type === 'error' ? normalFeeLevel.error : null;
    const hasUnavailableComposeState =
        normalFeeError !== null && (selectedFeeLevel === undefined || selectedFeeError !== null);

    const isFeeUnavailable = !isLoading && fee == null && hasUnavailableComposeState;

    if (!isFeeUnavailable) {
        return {
            isFeeUnavailable,
            feeError: null,
        };
    }

    return {
        isFeeUnavailable,
        feeError: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    };
};
