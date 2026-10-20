import { type StakingProviderId, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
    type StakeFormState,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { transformTxFixtures } from './__fixtures__/ethereumStaking';
import {
    type PrepareEthereumStakingContextState,
    buildEthereumStakingSignTransaction,
    prepareEthereumStakingContext,
    transformTx,
} from './ethereumStakingSignUtils';
import { WALLET_SDK_SOURCE, WALLET_SDK_SOURCE_MOBILE } from '../shared/stakingConstants';
import {
    buildClaimWithdrawRequestData,
    buildStakeData,
    buildUnstakeData,
} from './providers/everstake/everstakeCalldata';
import { UNSTAKE_INTERCHANGES } from './providers/everstake/everstakeConstants';

const ETH = asNetworkSymbol('eth');
const POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
const ACCOUNTING_ADDRESS = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';

const ethAccount = mockWalletAccount({
    symbol: ETH,
    descriptor: asAccountDescriptor('0xfffffffffffffffffffffffffffffffffffffffe'),
});
const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });

const buildState = (accounts: Account[] = [ethAccount]): PrepareEthereumStakingContextState =>
    ({ wallet: { accounts } }) as PrepareEthereumStakingContextState;

const buildCalldata = (stakeType: BaseStakeType, source = WALLET_SDK_SOURCE) => {
    if (stakeType === 'stake') return buildStakeData(source);
    if (stakeType === 'unstake') {
        return buildUnstakeData('1500000000000000000', UNSTAKE_INTERCHANGES, source);
    }

    return buildClaimWithdrawRequestData();
};

type BuildFormValuesParams = {
    stakeType?: BaseStakeType;
    amount?: string;
    transactionData?: string;
    address?: string;
};

const buildFormValues = ({
    stakeType = 'stake',
    amount = '1.5',
    transactionData = buildCalldata(stakeType),
    address = stakeType === 'claim' ? ACCOUNTING_ADDRESS : POOL_ADDRESS,
}: BuildFormValuesParams = {}): StakeFormState => ({
    outputs: [
        {
            address,
            amount,
            type: 'payment',
            token: null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    options: [],
    transactionData,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
    stakeType,
});

const buildPrecomposedTransaction = (
    overrides: Partial<PrecomposedTransactionFinal> = {},
): PrecomposedTransactionFinal =>
    ({
        type: 'final',
        feeLimit: '52000',
        feePerByte: '20',
        fee: '1040000',
        totalSpent: '0',
        outputs: [],
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
        ...overrides,
    }) as PrecomposedTransactionFinal;

type PrepareParams = {
    stakeType?: BaseStakeType;
    providerId?: StakingProviderId;
    formValues?: StakeFormState;
    precomposedTransaction?: PrecomposedTransactionFinal;
    accounts?: Account[];
    accountKey?: Account['key'];
    source?: string;
};

const prepare = ({
    stakeType = 'stake',
    providerId = 'everstake',
    formValues = buildFormValues({ stakeType }),
    precomposedTransaction = buildPrecomposedTransaction(),
    accounts,
    accountKey = ethAccount.key,
    source = WALLET_SDK_SOURCE,
}: PrepareParams = {}) =>
    prepareEthereumStakingContext(buildState(accounts), {
        accountKey,
        stakeType,
        providerId,
        precomposedTransaction,
        formValues,
        source,
    });

describe('prepareEthereumStakingContext', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reads the composed stake variant and converts the amount to wei', () => {
        const result = prepare();

        expect(result).toEqual({
            ok: true,
            context: {
                account: ethAccount,
                providerId: 'everstake',
                chainId: 1,
                gasLimit: '52000',
                variant: {
                    stakeType: 'stake',
                    calldata: buildStakeData(),
                    contractAddress: POOL_ADDRESS,
                    value: '1500000000000000000',
                },
                feeLevel: {
                    label: 'normal',
                    blocks: -1,
                    feePerUnit: '20',
                    feeLimit: '52000',
                    maxFeePerGas: undefined,
                    maxPriorityFeePerGas: undefined,
                },
                formState: expect.objectContaining({
                    transactionData: buildStakeData(),
                    feeLimit: '52000',
                    feePerUnit: '20',
                    stakeType: 'stake',
                }),
            },
        });
    });

    it('sends no value for unstake and claim', () => {
        expect(prepare({ stakeType: 'unstake' })).toMatchObject({
            ok: true,
            context: { variant: { contractAddress: POOL_ADDRESS, value: '0' } },
        });
        expect(prepare({ stakeType: 'claim' })).toMatchObject({
            ok: true,
            context: { variant: { contractAddress: ACCOUNTING_ADDRESS, value: '0' } },
        });
    });

    it('carries EIP-1559 fees into the sign form state', () => {
        const result = prepare({
            precomposedTransaction: buildPrecomposedTransaction({
                maxFeePerGas: '30',
                maxPriorityFeePerGas: '2',
            }),
        });

        expect(result).toMatchObject({
            ok: true,
            context: {
                feeLevel: { maxFeePerGas: '30', maxPriorityFeePerGas: '2' },
                formState: { maxFeePerGas: '30', maxPriorityFeePerGas: '2' },
            },
        });
    });

    it('carries the provider of the draft into the context', () => {
        const prepared = prepare();

        expect(prepared.ok && prepared.context.providerId).toBe('everstake');
    });

    it('fails for a provider without an Ethereum adapter', () => {
        const prepared = prepare({ providerId: 'fivebinaries' });

        expect(prepared).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Staking provider is not supported.',
            },
        });
    });

    it('fails for an account that is not an Ethereum account', () => {
        expect(prepare({ accounts: [solAccount], accountKey: solAccount.key })).toEqual({
            ok: false,
            error: { error: 'sign-transaction-failed', message: 'Ethereum account not found.' },
        });
    });

    it('fails without a gas limit on the selected fee level', () => {
        expect(
            prepare({
                precomposedTransaction: buildPrecomposedTransaction({ feeLimit: undefined }),
            }),
        ).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Selected fee level is missing gas limit.',
            },
        });
    });

    it('prefers the calldata carried by the composed fee level', () => {
        const result = prepare({
            formValues: buildFormValues({ transactionData: '' }),
            precomposedTransaction: buildPrecomposedTransaction({
                transactionData: buildStakeData(),
            }),
        });

        expect(result).toMatchObject({
            ok: true,
            context: { variant: { calldata: buildStakeData() } },
        });
    });

    it('verifies the calldata of the composed fee level over the form value', () => {
        const result = prepare({
            formValues: buildFormValues({ transactionData: buildStakeData() }),
            precomposedTransaction: buildPrecomposedTransaction({
                transactionData: buildCalldata('stake', WALLET_SDK_SOURCE_MOBILE),
            }),
        });

        expect(result).toMatchObject({
            ok: false,
            error: { message: 'Compose draft calldata failed verification.' },
        });
    });

    it('fails when neither the composed level nor the form carries calldata', () => {
        expect(prepare({ formValues: buildFormValues({ transactionData: '' }) })).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Compose result for stake is incomplete.',
            },
        });
    });

    it('fails a stake without a positive amount', () => {
        expect(prepare({ formValues: buildFormValues({ amount: '0' }) })).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Compose result for stake is incomplete.',
            },
        });
    });

    it('rejects calldata attributed to another app', () => {
        const result = prepare({
            formValues: buildFormValues({
                transactionData: buildCalldata('stake', WALLET_SDK_SOURCE_MOBILE),
            }),
        });

        expect(result).toEqual({
            ok: false,
            error: {
                error: 'sign-transaction-failed',
                message: 'Compose draft calldata failed verification.',
            },
        });
    });

    it('rejects calldata of a different staking operation', () => {
        const result = prepare({
            stakeType: 'stake',
            formValues: buildFormValues({
                stakeType: 'stake',
                transactionData: buildCalldata('unstake'),
            }),
        });

        expect(result).toMatchObject({
            ok: false,
            error: { message: 'Compose draft calldata failed verification.' },
        });
    });
});

describe('buildEthereumStakingSignTransaction', () => {
    it('builds a legacy transaction from the gas price', () => {
        const prepared = prepare();
        if (!prepared.ok) throw new Error('prepare failed');

        expect(buildEthereumStakingSignTransaction(prepared.context, '7')).toEqual({
            to: POOL_ADDRESS,
            value: '0x14d1120d7b160000',
            chainId: 1,
            nonce: '0x7',
            gasLimit: '0xcb20',
            data: buildStakeData(),
            gasPrice: '0x4a817c800',
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
        });
    });

    it('builds an EIP-1559 transaction when the level has a max fee', () => {
        const prepared = prepare({
            precomposedTransaction: buildPrecomposedTransaction({
                maxFeePerGas: '30',
                maxPriorityFeePerGas: '2',
            }),
        });
        if (!prepared.ok) throw new Error('prepare failed');

        expect(buildEthereumStakingSignTransaction(prepared.context, '7')).toMatchObject({
            gasPrice: undefined,
            maxFeePerGas: '0x6fc23ac00',
            maxPriorityFeePerGas: '0x77359400',
        });
    });
});

describe('transformTx', () => {
    transformTxFixtures.forEach(test => {
        it(test.description, () => {
            const result = transformTx(test.tx, test.nonce, test.chainId, test.gasPrice);
            expect(result).toEqual(test.result);
            expect(result).not.toHaveProperty('from');
        });
    });
});
