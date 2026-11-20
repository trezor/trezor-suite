import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { getStakeFormsDefaultValues } from '@suite-common/wallet-core';
import {
    type ComposeActionContext,
    type PrecomposedLevels,
    type StakeFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { composeTransaction } from './stakeFormEthereumActions';

const mockGetStakeTxGasLimit = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    getStakeTxGasLimit: (params: unknown) => mockGetStakeTxGasLimit(params),
}));

const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
// 1 ETH available; 300 000 gas at 20 gwei = 0.006 ETH fee
const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0x00000000000000000000000000000000000000aa'),
    balance: '1000000000000000000',
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
});

const compose = ({ amount, isMax }: { amount: string; isMax: boolean }) => {
    const defaults = getStakeFormsDefaultValues({
        address: POOL_ADDRESS,
        stakeType: 'stake',
        amount,
    });
    const formValues = {
        ...defaults,
        selectedFee: 'normal',
        setMaxOutputId: isMax ? 0 : undefined,
    } as StakeFormState;
    const formState: ComposeActionContext = {
        account,
        network: getNetwork('eth'),
        feeInfo: {
            blockHeight: 1,
            blockTime: 12,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 0,
            levels: [{ label: 'normal', feePerUnit: '20', feeLimit: '21000', blocks: -1 }],
        },
    };

    return composeTransaction(formValues, formState)() as Promise<PrecomposedLevels | undefined>;
};

describe('ethereum composeTransaction', () => {
    beforeEach(() => {
        mockGetStakeTxGasLimit.mockResolvedValue({ success: true, gasLimit: '300000' });
    });

    it('stakes the balance minus the composed fee and the withdrawal reserve on Max', async () => {
        const levels = await compose({ amount: '0.995', isMax: true });

        expect(levels?.normal).toMatchObject({ type: 'final', max: '0.989' });
    });

    it('stakes a typed amount as it is', async () => {
        const levels = await compose({ amount: '0.5', isMax: false });

        expect(levels?.normal).toMatchObject({ type: 'final', max: undefined });
        expect(levels?.normal?.type === 'final' && levels.normal.outputs[0]).toMatchObject({
            amount: '500000000000000000',
        });
    });
});
