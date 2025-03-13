import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Blockchain } from '../../backend/BlockchainLink';
import type { EthereumNetworkInfo, FeeLevel } from '../../types';
import { Blocks, MiscFeeLevels } from '../common/MiscFees';

export class EthereumFeeLevels extends MiscFeeLevels {
    coinInfo: EthereumNetworkInfo;
    levels: FeeLevel[];
    blocks: Blocks = [];

    constructor(coinInfo: EthereumNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
        this.levels = coinInfo.defaultFees;
    }

    async load(blockchain: Blockchain) {
        try {
            const [response] = await blockchain.estimateFee({ blocks: [1] });

            const { eip1559 } = response;

            const maxFeeInWei = new BigNumber(this.coinInfo.maxFee).multipliedBy('1e+9').toNumber();
            const minFeeInWei = new BigNumber(this.coinInfo.minFee).multipliedBy('1e+9').toNumber();
            const feeInWei = new BigNumber(response.feePerUnit).toNumber();

            // validate `feePerUnit` from the backend
            const feePerUnit = Math.min(maxFeeInWei, Math.max(minFeeInWei, feeInWei)).toString();

            if (eip1559) {
                const levels = (['low', 'medium', 'high'] as const).map(levelKey => {
                    const level = eip1559[levelKey];

                    // We can't pass BaseFeePerGas to firmware, so we calculate the effective gas price here
                    /*
                        const calculatedMaxBaseFeePerGas = BigNumber.minimum(
                            new BigNumber(level?.maxFeePerGas || '0'),
                            new BigNumber(eip1559.baseFeePerGas || '0').plus(
                                level?.maxPriorityFeePerGas || '0',
                            ),
                        ).toFixed();
                        */

                    const label = levelKey === 'medium' ? 'normal' : levelKey;

                    return {
                        label: label as FeeLevel['label'],
                        feePerUnit,
                        feeLimit: response.feeLimit,
                        blocks: -1,
                        baseFeePerGas: eip1559.baseFeePerGas,
                        maxFeePerGas: level?.maxFeePerGas,
                        maxPriorityFeePerGas: level?.maxPriorityFeePerGas,
                        minWaitTimeEstimate: level?.minWaitTimeEstimate,
                        maxWaitTimeEstimate: level?.maxWaitTimeEstimate,
                    };
                });

                this.levels = [...levels];
            } else {
                this.levels[0] = {
                    ...this.levels[0],
                    ...response,
                    feePerUnit,
                };
            }
        } catch {
            // silent
        }

        return this.levels;
    }
}
