import type { EthereumNetworkInfo, FeeLevel } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { cloneObject } from '@trezor/utils/src/cloneObject';
import { isNotNull } from '@trezor/utils/src/isNotNull';
import { clamp } from '@trezor/utils/src/number';

import type { Blockchain } from '../Blockchain';
import type { FeeLevels } from './feeLevelsBase';

export class EthereumFeeLevels implements FeeLevels {
    private coinInfo: EthereumNetworkInfo;
    private level: FeeLevel;
    private eip1559levels?: FeeLevel[];

    get levels() {
        return this.eip1559levels ?? [this.level];
    }

    // override only to narrow down the coinInfo type
    constructor(coinInfo: EthereumNetworkInfo) {
        this.coinInfo = coinInfo;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        this.level = cloneObject(coinInfo.defaultFees[0]);
    }

    async load(blockchain: Blockchain, request: Parameters<Blockchain['estimateFee']>[0]) {
        try {
            const estimateResult = await blockchain.estimateFee(request);
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const response: (typeof estimateResult)[number] = estimateResult[0];

            // gas price in wei
            const maxFeeInWei = new BigNumber(this.coinInfo.maxFee).multipliedBy('1e+9').toNumber();
            const minFeeInWei = new BigNumber(this.coinInfo.minFee).multipliedBy('1e+9').toNumber();
            const feeInWei = new BigNumber(response.feePerUnit).toNumber();

            // validate gas price from backend; clamp and round to integer wei (backend may return decimal)
            const feePerUnit = new BigNumber(clamp(feeInWei, minFeeInWei, maxFeeInWei)).toFixed(0);

            const { eip1559 } = response;

            if (eip1559?.baseFeePerGas) {
                const minMaxPriorityFeePerGas = new BigNumber(this.coinInfo.minPriorityFee)
                    .multipliedBy('1e+9')
                    .toNumber();

                // Fallback block estimates used when the provider (e.g. 1inch) doesn't supply
                // per-tier wait times. Values match typical EIP-1559 confirmation expectations.
                const defaultBlocks = { low: 4, medium: 2, high: 1 } as const;

                const levels = (['low', 'medium', 'high'] as const).map(levelKey => {
                    const level = eip1559[levelKey];

                    const label: FeeLevel['label'] = levelKey === 'medium' ? 'normal' : levelKey;

                    if (!level?.maxFeePerGas || !level?.maxPriorityFeePerGas) {
                        return null;
                    }

                    const maxFeePerGas = BigNumber.max(
                        minFeeInWei,
                        level.maxFeePerGas,
                        minMaxPriorityFeePerGas,
                    ).toFixed(0);

                    const maxPriorityFeePerGas = BigNumber.max(
                        minMaxPriorityFeePerGas,
                        BigNumber.min(maxFeePerGas, level.maxPriorityFeePerGas),
                    ).toFixed(0);

                    const blocksFromWaitTime = level.maxWaitTimeEstimate
                        ? Math.ceil(level.maxWaitTimeEstimate / 1000 / this.coinInfo.blockTime)
                        : 0;

                    return {
                        label,
                        feePerUnit,
                        feeLimit: response.feeLimit,
                        blocks: blocksFromWaitTime || defaultBlocks[levelKey],
                        baseFeePerGas: eip1559.baseFeePerGas,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                    };
                });

                this.eip1559levels = levels.filter(isNotNull);
            } else {
                this.eip1559levels = undefined;
                this.level = { ...this.level, ...response, feePerUnit };
            }
        } catch {
            // silent
        }
    }
}
