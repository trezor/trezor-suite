import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    btcAsset,
    ethAsset,
    ethOnBaseAsset,
    getBtcAccount,
    getEthAccount,
    usdcAsset,
    usdtAsset,
} from '@suite-native/trading-fixtures';

import {
    TradeableAssetAccountBalance,
    type TradeableAssetAccountBalanceProps,
} from '../TradeableAssetAccountBalance';

describe('TradeableAssetAccountBalance', () => {
    const renderTradeableAssetAccountBalance = (
        props: Partial<TradeableAssetAccountBalanceProps> = {},
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProvider(
            <TradeableAssetAccountBalance
                asset={undefined}
                account={undefined}
                testID="TEST_ID"
                {...props}
            />,
            { preloadedState },
        );

    it('should render nothing without asset selected', () => {
        const { toJSON } = renderTradeableAssetAccountBalance({});

        expect(toJSON()).toBeNull();
    });

    it.each([
        [btcAsset, 'BTC'],
        [ethAsset, 'ETH'],
        [ethOnBaseAsset, 'ETH'],
        [usdcAsset, 'USDC'],
    ])(
        'should render empty balance when account is not selected, case %#',
        (asset, expectedSymbol) => {
            const { getByText } = renderTradeableAssetAccountBalance({ asset });

            expect(getByText('Balance:')).toBeDefined();
            expect(getByText(`- ${expectedSymbol}`)).toBeDefined();
        },
    );

    it('should use correct TestIDs when no balance is displayed', () => {
        const { getByTestId } = renderTradeableAssetAccountBalance({ asset: btcAsset });

        expect(getByTestId('TEST_ID')).toHaveTextContent('Balance:- BTC');
        expect(getByTestId('TEST_ID/no-value')).toHaveTextContent('- BTC');
    });

    it('should render without TestID', () => {
        const { getByText } = renderTradeableAssetAccountBalance({
            asset: btcAsset,
            testID: undefined,
        });

        expect(getByText('Balance:')).toBeDefined();
        expect(getByText('- BTC')).toBeDefined();
    });

    describe('with ETH account selected', () => {
        const preloadedState: PreloadedState = {
            wallet: {
                accounts: [getEthAccount(), getBtcAccount()],
            },
        };

        it.each([
            [ethAsset, '0.00000081 ETH'],
            [usdcAsset, '1 USDC'],
            [usdtAsset, '0 USDT'],
        ])('should display correct balance for asset, case %s', (asset, expectedBalance) => {
            const { getByText, getByTestId } = renderTradeableAssetAccountBalance(
                {
                    asset,
                    account: getEthAccount(),
                },
                preloadedState,
            );

            expect(getByText('Balance:')).toBeDefined();
            expect(getByTestId('TEST_ID/value')).toHaveTextContent(expectedBalance);
        });
    });
});
