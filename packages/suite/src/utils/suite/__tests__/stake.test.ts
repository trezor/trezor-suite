import { DeepPartial } from 'react-hook-form';
import { transformTxFixtures, getUnstakeAmountFixtures } from '../__fixtures__/stake';
import { transformTx, getUnstakeAmount, handleStakeTransaction } from '../stake';
import { FormState, StakeType } from '@suite-common/wallet-types';

describe('transformTx', () => {
    transformTxFixtures.forEach(test => {
        it(test.description, () => {
            const result = transformTx(test.tx, test.gasPrice, test.nonce, test.chainId);
            expect(result).toEqual(test.result);
            expect(result).not.toHaveProperty('from');
        });
    });
});

describe('getUnstakeAmount', () => {
    it('should correctly extract and convert the unstake amount from ethereum data', () => {
        const { ethereumData, expectedAmountWei } = getUnstakeAmountFixtures;
        const result = getUnstakeAmount(ethereumData);
        expect(result).toBe(expectedAmountWei);
    });
});

describe('handleStakeTransaction', () => {
    const { ethereumData, expectedAmountEther } = getUnstakeAmountFixtures;

    const mockValues: DeepPartial<FormState> = {
        rbfParams: {
            ethereumData,
        },
        outputs: [{ amount: '0' }],
    };

    const mockValuesWithoutEthereumData: DeepPartial<FormState> = {
        rbfParams: {},
        outputs: [{ amount: '0' }],
    };

    it('should update ethereumStakeType to stake', () => {
        const txStakeName: StakeType = 'stake';
        const result = handleStakeTransaction(mockValues as FormState, txStakeName);
        expect(result.ethereumStakeType).toBe('stake');
        expect(result.outputs[0].amount).toBe('0'); // no change
    });

    it('should update ethereumStakeType to unstake and modify the amount', () => {
        const txStakeName: StakeType = 'unstake';
        const result = handleStakeTransaction(mockValues as FormState, txStakeName);
        expect(result.ethereumStakeType).toBe('unstake');
        expect(result.outputs[0].amount).toBe(expectedAmountEther);
    });

    it('should handle unstake with no ethereumData gracefully', () => {
        const txStakeName: StakeType = 'unstake';
        const result = handleStakeTransaction(
            mockValuesWithoutEthereumData as FormState,
            txStakeName,
        );
        expect(result.ethereumStakeType).toBe('unstake');
        expect(result.outputs[0].amount).toBe('0'); // no change
    });
});
