import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import {
    AccountDetailStackRoutes,
    AppTabsRoutes,
    AssetsStackRoutes,
    RootStackRoutes,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';

import { getSendFlowExitDestination, getSendMaxAmount, navigateOutOfSendFlowAction } from './utils';

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
            expectedIndex: 2,
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
            expectedIndex: 2,
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
