import { BigNumber } from '@trezor/utils/src/bigNumber';

import { Blockchain } from '../../backend/BlockchainLink';
import type { EthereumNetworkInfo, FeeLevel } from '../../types';
import { Blocks, MiscFeeLevels, findBlocksForFee } from '../common/MiscFees';

type EipResponse1559Level = 'low' | 'medium' | 'high';
type Eip1559Level = 'low' | 'normal' | 'high';
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
            if (response.eip1559) {
                const eip1559ResponseLevelKeys = [
                    'low',
                    'medium',
                    'high',
                ] as EipResponse1559Level[];

                const { eip1559 } = response;
                const eip1559Levels = eip1559ResponseLevelKeys.map(levelKey => {
                    const level = eip1559[levelKey];

                    // We can't pass BaseFeePerGas to firmware, so we calculate the effective gas price here
                    const calculatedMaxFeePerGas = BigNumber.minimum(
                        new BigNumber(level?.maxFeePerGas || '0'),
                        new BigNumber(eip1559.baseFeePerGas || '0').plus(
                            level?.maxPriorityFeePerGas || '0',
                        ),
                    ).toFixed();

                    const label =
                        levelKey === 'medium'
                            ? ('normal' as Eip1559Level)
                            : (levelKey as Eip1559Level);

                    return {
                        label,
                        maxFeePerGas: level?.maxFeePerGas || '0',
                        effectiveGasPrice: calculatedMaxFeePerGas,
                        maxPriorityFeePerGas: level?.maxPriorityFeePerGas || '0',
                        baseFeePerGas: eip1559.baseFeePerGas,
                        minWaitTimeEstimate: level?.minWaitTimeEstimate
                            ? level.minWaitTimeEstimate / 1000
                            : undefined, // Infura provides wait time in miliseconds
                        maxWaitTimeEstimate: level?.maxWaitTimeEstimate
                            ? level.maxWaitTimeEstimate / 1000
                            : undefined,
                        feePerUnit: '0',
                        feeLimit: response.feeLimit,
                        blocks: -1,
                    };
                });

                this.levels = [...eip1559Levels];
            } else {
                super.load(blockchain);
            }
        } catch {
            // silent
        }

        return this.levels;
    }

    updateEthereumCustomFee(
        feePerUnit: string,
        effectiveGasPrice?: string,
        maxPriorityFeePerGas?: string,
    ) {
        // remove "custom" level from list
        this.levels = this.levels.filter(l => l.label !== 'custom');
        // recreate "custom" level
        const blocks = findBlocksForFee(feePerUnit, this.blocks);
        this.levels.push({
            label: 'custom',
            feePerUnit,
            blocks,
            maxPriorityFeePerGas,
            effectiveGasPrice,
        });
    }
}
