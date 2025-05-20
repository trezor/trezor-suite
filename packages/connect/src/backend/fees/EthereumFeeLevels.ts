import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { EthereumNetworkInfo, FeeLevel } from '../../types';
import { Blockchain } from '../Blockchain';
import { Blocks, MiscFeeLevels } from './MiscFeeLevels';

export class EthereumFeeLevels extends MiscFeeLevels {
    coinInfo: EthereumNetworkInfo;
    blocks: Blocks = [];

    // override only to narrow down the coinInfo type
    constructor(coinInfo: EthereumNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
    }

    async load(blockchain: Blockchain, request: Parameters<typeof blockchain.estimateFee>[0]) {
        try {
            const [response] = await blockchain.estimateFee(request);

            const { eip1559 } = response;

            // gas price in wei
            const maxFeeInWei = new BigNumber(this.coinInfo.maxFee).multipliedBy('1e+9').toNumber();
            const minFeeInWei = new BigNumber(this.coinInfo.minFee).multipliedBy('1e+9').toNumber();
            const feeInWei = new BigNumber(response.feePerUnit).toNumber();

            // validate gas price from backend
            const feePerUnit = Math.min(maxFeeInWei, Math.max(minFeeInWei, feeInWei)).toString();

            if (eip1559?.baseFeePerGas) {
                const levels = (['low', 'medium', 'high'] as const).map(levelKey => {
                    const level = eip1559[levelKey];

                    const label = levelKey === 'medium' ? 'normal' : levelKey;

                    if (!level?.maxFeePerGas || !level?.maxPriorityFeePerGas) {
                        return null;
                    }

                    const maxFeePerGas = BigNumber.max(
                        this.coinInfo.minFee,
                        level.maxFeePerGas,
                    ).toString();

                    const maxPriorityFeePerGas = BigNumber.min(
                        maxFeePerGas,
                        level.maxPriorityFeePerGas,
                    ).toString();

                    return {
                        label,
                        feePerUnit,
                        feeLimit: response.feeLimit,
                        blocks: Math.max(
                            1,
                            (level?.maxWaitTimeEstimate || 0) / 1000 / this.coinInfo.blockTime,
                        ),
                        baseFeePerGas: eip1559.baseFeePerGas,
                        maxFeePerGas,
                        maxPriorityFeePerGas,
                    };
                });

                this.levels = levels.filter(level => level) as FeeLevel[];
            } else {
                this.levels[0] = {
                    ...this.levels[0],
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
