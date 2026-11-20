import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type BottomSheetModalProps } from '@suite-native/atoms';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { YieldApyBreakdownBottomSheet } from './YieldApyBreakdownBottomSheet';

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    BottomSheetModal: ({ children, bottomSheetCustomProps, onDismiss }: BottomSheetModalProps) => {
        const { View } = jest.requireActual('react-native');
        const events = { onChange: bottomSheetCustomProps?.onChange, onDismiss };

        return (
            <View testID="apy-sheet" {...events}>
                {children}
            </View>
        );
    },
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const vault = mockYieldVault();

describe('Yield APY interaction analytics', () => {
    it('reports each presentation once, without counting mounting, resizing or rerenders', async () => {
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
        const props = { account, vault, ref: { current: null }, onClose: mock<() => void>() };
        const view = await renderWithBasicProvider(<YieldApyBreakdownBottomSheet {...props} />, {
            services,
        });
        expect(services.analytics.report).not.toHaveBeenCalled();

        await fireEvent(view.getByTestId('apy-sheet'), 'change', 0);
        await fireEvent(view.getByTestId('apy-sheet'), 'change', 1);
        await view.rerender(<YieldApyBreakdownBottomSheet {...props} vault={{ ...vault }} />);
        expect(services.analytics.report).toHaveBeenCalledTimes(1);

        await fireEvent(view.getByTestId('apy-sheet'), 'dismiss');
        await fireEvent(view.getByTestId('apy-sheet'), 'change', 0);
        expect(jest.mocked(services.analytics.report).mock.calls.map(([event]) => event)).toEqual(
            Array.from({ length: 2 }, () => ({
                type: 'yield/interaction',
                payload: { element: 'apy-tooltip', networkSymbol: 'eth', vaultId: vault.id },
            })),
        );
    });
});
