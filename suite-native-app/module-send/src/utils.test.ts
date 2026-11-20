import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import {
    AccountDetailStackRoutes,
    AppTabsRoutes,
    AssetsStackRoutes,
    RootStackRoutes,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';

import { type SendOutputsFormValues } from './sendOutputsFormSchema';
import {
    constructFormDraft,
    getSendFeeStatus,
    getSendFlowExitDestination,
    getSendMaxAmount,
    navigateOutOfSendFlowAction,
} from './utils';

describe('selected Send fee and network reserve', () => {
    const finalFee: GeneralPrecomposedTransactionFinal = {
        type: 'final',
        fee: '1000000000000000',
        feePerByte: '1',
        totalSpent: '999500000000000000',
        bytes: 0,
        inputs: [],
        outputs: [],
        outputsPermutation: [],
    };

    it.each([
        ['Normal enters the reserve', '1000000000000000', '0.9985', false, '0.998'],
        ['Low preserves the exact reserve', '500000000000000', '0.9985', true, '0.9985'],
        ['one wei enters the reserve', '500000000000000', '0.998500000000000001', false, '0.9985'],
        ['Custom uses its actual fee', '1500000000000000', '0.998', false, '0.9975'],
    ] as const)('%s', (_description, fee, amount, isFeeReady, maxAmountForReserve) => {
        expect(
            getSendFeeStatus({
                feeLevel: { ...finalFee, fee },
                symbol: asNetworkSymbol('base'),
                availableBalance: '1000000000000000000',
                networkReserve: '0.001',
                amount,
            }),
        ).toEqual({ isFeeReady, maxAmountForReserve });
    });

    it.each([
        ['High', '2000000000000000', '0.997'],
        ['Custom', '2500000000000000', '0.9965'],
    ] as const)(
        'allows Send Max with %s when the Normal-filled amount exceeds the selected maximum',
        (_description, fee, max) => {
            expect(
                getSendFeeStatus({
                    feeLevel: { ...finalFee, fee, max, totalSpent: '999000000000000000' },
                    symbol: asNetworkSymbol('base'),
                    availableBalance: '1000000000000000000',
                    networkReserve: '0.001',
                    amount: '0.998',
                }).isFeeReady,
            ).toBe(true);
        },
    );

    it('blocks a composed Send Max amount that enters the reserve even if the form amount fits', () => {
        expect(
            getSendFeeStatus({
                feeLevel: {
                    ...finalFee,
                    max: '0.998000000000000001',
                    totalSpent: '999000000000000001',
                },
                symbol: asNetworkSymbol('base'),
                availableBalance: '1000000000000000000',
                networkReserve: '0.001',
                amount: '0.99',
            }).isFeeReady,
        ).toBe(false);
    });

    it('allows the amount when the reserve is switched off', () => {
        expect(
            getSendFeeStatus({
                feeLevel: finalFee,
                symbol: asNetworkSymbol('base'),
                availableBalance: '1000000000000000000',
                amount: '0.9985',
            }).isFeeReady,
        ).toBe(true);
    });

    it('uses lamports for a Solana selected fee', () => {
        expect(
            getSendFeeStatus({
                feeLevel: { ...finalFee, fee: '1000000' },
                symbol: asNetworkSymbol('sol'),
                availableBalance: '1000000000',
                networkReserve: '0.001',
                amount: '0.9985',
            }),
        ).toEqual({ isFeeReady: false, maxAmountForReserve: '0.998' });
    });

    it('keeps review blocked without a final selected transaction', () => {
        expect(
            getSendFeeStatus({
                feeLevel: { type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' },
                symbol: asNetworkSymbol('base'),
                availableBalance: '1000000000000000000',
                networkReserve: '0.001',
                amount: '0.9985',
            }).isFeeReady,
        ).toBe(false);
    });
});

describe(getSendMaxAmount.name, () => {
    test.each([
        {
            description: 'returns the token balance for a token send',
            input: {
                isTokenFlow: true,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            },
            expected: '42',
        },
        {
            description: 'returns the fee-adjusted amount for a native asset send',
            input: {
                isTokenFlow: false,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            },
            expected: '0.5',
        },
    ])('$description', ({ input, expected }) => {
        expect(getSendMaxAmount(input)).toBe(expected);
    });
});

describe(constructFormDraft.name, () => {
    const formValues = {
        outputs: [{ address: 'address', amount: '1', fiat: '' }],
    } as unknown as SendOutputsFormValues;

    it('tags the draft as a broadcast send', () => {
        expect(constructFormDraft({ formValues })).toMatchObject({
            txType: 'send',
            options: ['broadcast'],
        });
    });

    it('adds the destination tag and transaction data options when the form sets them', () => {
        const draft = constructFormDraft({
            formValues: { ...formValues, destinationTag: '123', transactionData: '0x00' },
        });

        expect(draft.options).toEqual(['broadcast', 'destinationTag', 'transactionData']);
        expect(draft.destinationTag).toBe('123');
        expect(draft.transactionData).toBe('0x00');
    });
});

const networkSymbol = asNetworkSymbol('eth');
const accountKey = mockAccountKey({ symbol: networkSymbol, descriptor: 'eth0' });
const tokenContract = '0x1234567890123456789012345678901234567890' as TokenAddress;
const txid = 'mockTxid';

describe(getSendFlowExitDestination.name, () => {
    test.each([
        {
            description: 'exits to the asset detail while the assets-first experiment is active',
            input: { isAssetsFirstEnabled: true, networkSymbol },
            expected: { type: 'assetDetail', networkSymbol },
        },
        {
            description: 'exits to the account detail while the experiment is off',
            input: { isAssetsFirstEnabled: false, networkSymbol },
            expected: { type: 'accountDetail' },
        },
        {
            description: 'falls back to the account detail when the network symbol is unresolved',
            input: { isAssetsFirstEnabled: true, networkSymbol: null },
            expected: { type: 'accountDetail' },
        },
    ])('$description', ({ input, expected }) => {
        expect(getSendFlowExitDestination(input)).toEqual(expected);
    });
});

const homeRoute = {
    name: RootStackRoutes.AppTabs,
    params: { screen: AppTabsRoutes.HomeStack },
};

const accountDetailRoute = {
    name: RootStackRoutes.AccountDetailStack,
    params: {
        screen: AccountDetailStackRoutes.AccountDetail,
        params: { accountKey, tokenContract, closeActionType: 'back' },
    },
};

const assetDetailRoute = {
    name: RootStackRoutes.AssetsStack,
    params: {
        screen: AssetsStackRoutes.AssetDetail,
        params: { networkSymbol, tokenContract },
    },
};

const transactionDetailRoute = {
    name: RootStackRoutes.TransactionDetailStack,
    params: {
        screen: TransactionDetailStackRoutes.TransactionDetail,
        params: { accountKey, tokenContract, txid, closeActionType: 'close', source: 'send' },
    },
};

describe(navigateOutOfSendFlowAction.name, () => {
    test.each([
        {
            description: 'focuses the account detail when a send is abandoned, home behind it',
            input: { accountKey, tokenContract, destination: { type: 'accountDetail' } as const },
            expectedIndex: 1,
            expectedRoutes: [homeRoute, accountDetailRoute],
        },
        {
            description: 'focuses the transaction detail after a confirmed send',
            input: {
                accountKey,
                tokenContract,
                txid,
                destination: { type: 'accountDetail' } as const,
            },
            expectedIndex: 1,
            expectedRoutes: [homeRoute, accountDetailRoute, transactionDetailRoute],
        },
        {
            description: 'focuses the asset detail when a send is abandoned in assets-first',
            input: {
                accountKey,
                tokenContract,
                destination: { type: 'assetDetail', networkSymbol } as const,
            },
            expectedIndex: 1,
            expectedRoutes: [homeRoute, assetDetailRoute],
        },
        {
            description:
                'keeps the asset detail behind the transaction detail after a confirmed send',
            input: {
                accountKey,
                tokenContract,
                txid,
                destination: { type: 'assetDetail', networkSymbol } as const,
            },
            expectedIndex: 1,
            expectedRoutes: [homeRoute, assetDetailRoute, transactionDetailRoute],
        },
    ])('$description', ({ input, expectedIndex, expectedRoutes }) => {
        expect(navigateOutOfSendFlowAction(input)).toEqual({
            type: 'RESET',
            payload: { index: expectedIndex, routes: expectedRoutes },
        });
    });

    it('omits the token contract from the asset detail for a native asset send', () => {
        expect(
            navigateOutOfSendFlowAction({
                accountKey,
                destination: { type: 'assetDetail', networkSymbol },
            }),
        ).toEqual({
            type: 'RESET',
            payload: {
                index: 1,
                routes: [
                    homeRoute,
                    {
                        name: RootStackRoutes.AssetsStack,
                        params: {
                            screen: AssetsStackRoutes.AssetDetail,
                            params: { networkSymbol, tokenContract: undefined },
                        },
                    },
                ],
            },
        });
    });
});
