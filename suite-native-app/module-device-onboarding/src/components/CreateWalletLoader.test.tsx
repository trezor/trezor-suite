import { View as MockView, type ViewProps } from 'react-native';

import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { CreateWalletLoader } from './CreateWalletLoader';

jest.mock('@shopify/react-native-skia', () => ({
    Group: MockView,
    RoundedRect: () => null,
    Canvas: (props: ViewProps) => <MockView {...props} testID="wallet-loader-canvas" />,
}));

describe('CreateWalletLoader', () => {
    it('follows its container width when the device folds and unfolds', async () => {
        const { container, getByTestId } = await renderWithStoreProvider(<CreateWalletLoader />);
        const wrapper = container.queryAll(view => typeof view.props.onLayout === 'function')[0];

        if (!wrapper) throw new Error('Wallet loader must measure its containing view.');

        for (const width of [320, 740, 320]) {
            await fireEvent(wrapper, 'layout', {
                nativeEvent: { layout: { width, height: 4, x: 0, y: 0 } },
            });

            expect(getByTestId('wallet-loader-canvas')).toHaveStyle({ width, height: 4 });
        }
    });
});
