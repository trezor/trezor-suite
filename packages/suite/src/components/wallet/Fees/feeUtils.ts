import { type TranslationKey } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import {
    type GeneralPrecomposedTransaction,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

type FeeNetworkParams = {
    networkType: NetworkType;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
};

type FeeTooltipParams = {
    networkType: NetworkType;
    isTronAccountActivation?: boolean;
};

type GetSupportsAdjustableFeesParams = {
    networkType: NetworkType;
    isTokenTransfer: boolean;
};

type GetTronFeeLimitSunParams = {
    tx: GeneralPrecomposedTransaction | undefined;
    formFeeLimit: string | undefined;
};

export const getIsTrc20Transfer = ({ networkType, composedLevels }: FeeNetworkParams): boolean => {
    if (networkType !== 'tron' || composedLevels == null) return false;
    const { normal } = composedLevels;

    return normal != null && normal.type !== 'error' && 'token' in normal && normal.token != null;
};

export const getSupportsAdjustableFees = ({
    networkType,
    isTokenTransfer,
}: GetSupportsAdjustableFeesParams): boolean =>
    networkType !== 'solana' && (networkType !== 'tron' || isTokenTransfer);

// The send form and the transaction review must show the same maximum TRX burn, so both derive
// the fee limit here instead of each picking its own.
export const getTronFeeLimitSun = ({
    tx,
    formFeeLimit,
}: GetTronFeeLimitSunParams): string | undefined => {
    const estimatedFeeLimit = tx?.type !== 'error' ? tx?.estimatedFeeLimit : undefined;

    return formFeeLimit && estimatedFeeLimit && new BigNumber(formFeeLimit).gt(estimatedFeeLimit)
        ? formFeeLimit
        : estimatedFeeLimit;
};

export const getFeeTooltipTextId = ({
    networkType,
    isTronAccountActivation,
}: FeeTooltipParams): TranslationKey => {
    switch (networkType) {
        case 'ethereum':
            return 'TR_EVM_MAX_FEE_DESC';
        case 'stellar':
            return 'TR_STELLAR_FEE_DESC';
        case 'solana':
            return 'TR_SOL_FEE_DESC';
        case 'ripple':
            return 'TR_XRP_FEE_DESC';
        case 'tron':
            return isTronAccountActivation ? 'TR_TRON_FEE_ACTIVATION_DESC' : 'TR_TRON_FEE_DESC';
        default:
            return 'TR_TRANSACTION_FEE_DESC';
    }
};
