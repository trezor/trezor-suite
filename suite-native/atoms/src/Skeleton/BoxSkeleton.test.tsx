import { View as MockView, type ViewProps } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { BoxSkeleton } from './BoxSkeleton';

jest.unmock('./BoxSkeleton');

jest.mock('@shopify/react-native-skia', () => ({
    Group: MockView,
    LinearGradient: () => null,
    RoundedRect: () => null,
    rect: jest.fn(),
    rrect: jest.fn(),
    vec: jest.fn(),
    Canvas: (props: ViewProps) => <MockView {...props} testID="skeleton-canvas" />,
}));

describe('BoxSkeleton responsive sizing', () => {
    it('resizes its canvas when the containing card changes width', async () => {
        const { container, queryByTestId, getByTestId } = await renderWithBasicProvider(
            <BoxSkeleton width="80%" height={40} />,
        );
        const wrapper = container.queryAll(view => typeof view.props.onLayout === 'function')[0];

        if (!wrapper) throw new Error('Responsive skeleton must measure its containing view.');

        expect(queryByTestId('skeleton-canvas')).toBeNull();

        await fireEvent(wrapper, 'layout', {
            nativeEvent: { layout: { width: 240, height: 40, x: 0, y: 0 } },
        });
        expect(getByTestId('skeleton-canvas')).toHaveStyle({ width: 240, height: 40 });

        await fireEvent(wrapper, 'layout', {
            nativeEvent: { layout: { width: 560, height: 40, x: 0, y: 0 } },
        });
        expect(getByTestId('skeleton-canvas')).toHaveStyle({ width: 560, height: 40 });
    });

    it('renders an explicit pixel width without waiting for layout', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <BoxSkeleton width={120} height={20} />,
        );
        expect(getByTestId('skeleton-canvas')).toHaveStyle({ width: 120, height: 20 });
    });
});
