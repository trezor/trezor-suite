import { type TranslationKey } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { type PrecomposedLevels, type PrecomposedLevelsCardano } from '@suite-common/wallet-types';

type FeeNetworkParams = {
    networkType: NetworkType;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
};

type FeeTooltipParams = {
    networkType: NetworkType;
    isTronAccountActivation?: boolean;
    isTokenTransfer?: boolean;
};

type GetSupportsAdjustableFeesParams = {
    networkType: NetworkType;
    isTokenTransfer: boolean;
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

export const getFeeTooltipTextId = ({
    networkType,
    isTronAccountActivation,
    isTokenTransfer,
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
            if (isTokenTransfer) {
                return 'TR_TRON_MAX_FEE_DESC';
            }

            return isTronAccountActivation ? 'TR_TRON_FEE_ACTIVATION_DESC' : 'TR_TRON_FEE_DESC';
        default:
            return 'TR_TRANSACTION_FEE_DESC';
    }
};
