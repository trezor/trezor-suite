import type { EthereumNetworkInfo, FeeLevel } from '@trezor/connect-common';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { Blockchain } from '../Blockchain';
import { MiscFeeLevels } from './MiscFeeLevels';

export class EthereumFeeLevels extends MiscFeeLevels {
    coinInfo: EthereumNetworkInfo;

    // override only to narrow down the coinInfo type
    constructor(coinInfo: EthereumNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
    }

    async load(blockchain: Blockchain, request: Parameters<typeof blockchain.estimateFee>[0]) {
        try {
            const estimateResult = await blockchain.estimateFee(request);
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const response: (typeof estimateResult)[number] = estimateResult[0];

            const { eip1559 } = response;

            // gas price in wei
            const maxFeeInWei = new BigNumber(this.coinInfo.maxFee).multipliedBy('1e+9').toNumber();
            const minFeeInWei = new BigNumber(this.coinInfo.minFee).multipliedBy('1e+9').toNumber();
            const feeInWei = new BigNumber(response.feePerUnit).toNumber();

            // validate gas price from backend; clamp and round to integer wei (backend may return decimal)
            const feePerUnit = new BigNumber(
                Math.min(maxFeeInWei, Math.max(minFeeInWei, feeInWei)),
            ).toFixed(0);

            if (eip1559?.baseFeePerGas) {
                const minMaxPriorityFeePerGas = new BigNumber(this.coinInfo.minPriorityFee)
                    .multipliedBy('1e+9')
                    .toNumber();

                const levels = (['low', 'medium', 'high'] as const).map(levelKey => {
                    const level = eip1559[levelKey];

                    const label = levelKey === 'medium' ? 'normal' : levelKey;

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

                    return {
                        label,
                        feePerUnit,
                        feeLimit: response.feeLimit,
                        blocks: Math.ceil(
                            Math.max(
                                1,
                                (level?.maxWaitTimeEstimate || 0) / 1000 / this.coinInfo.blockTime,
                            ),
                        ),
                        baseFeePerGas: eip1559.baseFeePerGas,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                    };
                });

                this.levels = levels.filter(level => level) as FeeLevel[];
            } else {
                // @ts-expect-error: indexing with noUncheckedIndexedAccess
                const currentLevel: (typeof this.levels)[number] = this.levels[0];
                this.levels[0] = {
                    ...currentLevel,
                    ...response,
                    feePerUnit,
                };
            }
            this.wasFetchedSuccessfully = true;
        } catch {
            // silent
        }

        return this.levels;
    }
}
