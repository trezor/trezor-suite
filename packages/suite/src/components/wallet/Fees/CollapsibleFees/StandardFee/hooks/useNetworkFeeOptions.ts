import { useMemo } from 'react';

import { type NetworkSymbol, type NetworkType, getNetwork } from '@suite-common/wallet-config';
import { type PrecomposedLevels, type PrecomposedLevelsCardano } from '@suite-common/wallet-types';
import { type AmountUnit, asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

export type FeeOptionType = {
    value: FeeLevel['label'];
    blocks?: number;
    feePerUnit?: string;
    networkAmount: AmountUnit | null;
    feePerTx?: string; // Solana specific
    // EIP-1559
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    baseFeePerGas?: string;
};

export type UseNetworkFeeOptionsProps = {
    networkType: NetworkType;
    networkSymbol: NetworkSymbol;
    levels: FeeLevel[];
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
};

export function useNetworkFeeOptions({
    networkType,
    networkSymbol,
    levels,
    composedLevels,
}: UseNetworkFeeOptionsProps): FeeOptionType[] {
    return useMemo(() => {
        const filteredLevels = levels.filter(
            level => level.label !== 'custom' && level.label !== 'low',
        );

        const getNetworkAmount = (level: FeeLevel) => {
            const transactionInfo = composedLevels?.[level.label];
            const hasTransactionInfo =
                transactionInfo !== undefined && transactionInfo.type !== 'error';
            const networkAmount = hasTransactionInfo
                ? subunitsToUnits({
                      value: asAmountSubunit(new BigNumber(transactionInfo.fee)),
                      symbol: networkSymbol,
                      decimals: getNetwork(networkSymbol)?.decimals,
                  })
                : null;
            // Needed only for Solana because of fee estimation on compose Tx
            const fee = hasTransactionInfo ? transactionInfo.fee : level.feePerTx;

            return { networkAmount, fee };
        };

        const buildBasicFeeOptions = (level: FeeLevel) => {
            const { networkAmount } = getNetworkAmount(level);

            return {
                ...level,
                value: level.label,
                networkAmount,
            };
        };

        switch (networkType) {
            case 'solana':
                return filteredLevels.map(level => {
                    const { fee } = getNetworkAmount(level);
                    const basicFeeOption = buildBasicFeeOptions(level);

                    return {
                        ...basicFeeOption,
                        feePerTx: fee,
                    };
                });

            case 'bitcoin':
                return filteredLevels.map(level => {
                    const basicFeeOption = buildBasicFeeOptions(level);

                    return {
                        ...basicFeeOption,
                        blocks: level.blocks,
                    };
                });

            default:
                return filteredLevels.map(buildBasicFeeOptions);
        }
    }, [levels, networkType, networkSymbol, composedLevels]);
}
