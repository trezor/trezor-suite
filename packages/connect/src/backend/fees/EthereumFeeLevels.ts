import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { EthereumNetworkInfo, FeeLevel } from '../../types';
import { Blockchain } from '../Blockchain';
import { Blocks, MiscFeeLevels } from './MiscFeeLevels';

export class EthereumFeeLevels extends MiscFeeLevels {
    coinInfo: EthereumNetworkInfo;
    levels: FeeLevel[];
    blocks: Blocks = [];

    constructor(coinInfo: EthereumNetworkInfo) {
        super(coinInfo);
        this.coinInfo = coinInfo;
        this.levels = coinInfo.defaultFees;
    }

    async load(blockchain: Blockchain, request: Parameters<typeof blockchain.estimateFee>[0]) {
        try {
            const [response] = await blockchain.estimateFee(request);

            const { eip1559 } = response;

            // TODO: use web3-utils?
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

                    return {
                        label,
                        feePerUnit,
                        feeLimit: response.feeLimit,
                        blocks: -1, // TODO: reuse this instead of maxWaitTimeEstimate?
                        baseFeePerGas: eip1559.baseFeePerGas,
                        maxFeePerGas: level?.maxFeePerGas,
                        maxPriorityFeePerGas: level?.maxPriorityFeePerGas,
                        maxWaitTimeEstimate: level?.maxWaitTimeEstimate,
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
        } catch {
            // silent
        }

        return this.levels;
    }
}
