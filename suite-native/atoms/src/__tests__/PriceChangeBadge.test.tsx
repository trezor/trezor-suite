import { ProviderForTests, renderHook, renderWithProviders } from '@suite-native/test-utils';
import { type NativeStyleUtils, useNativeStyles } from '@trezor/styles-native';

import { Box as MockBox } from '../Box';
import { PriceChangeBadge } from '../PriceChangeBadge';

jest.mock('../Skeleton/BoxSkeleton', () => ({
    BoxSkeleton: () => <MockBox testID="skeleton-box" />,
}));

describe('PriceChangeBadge', () => {
    let colors: NativeStyleUtils['colors'];

    beforeAll(() => {
        const { result } = renderHook(() => useNativeStyles(), { wrapper: ProviderForTests });
        ({ colors } = result.current.utils);
    });

    it('should render green badge for change > 0', () => {
        const { getByText } = renderWithProviders(
            <PriceChangeBadge valuePercentageChange={0.01} />,
            { providers: ['intl'] },
        );

        expect(getByText('1.00%')).toHaveStyle({ color: colors.contentBrand });
    });

    it('should render green badge for change = 0', () => {
        const { getByText } = renderWithProviders(<PriceChangeBadge valuePercentageChange={0} />, {
            providers: ['intl'],
        });

        expect(getByText('0.00%')).toHaveStyle({ color: colors.contentBrand });
    });

    it('should render red badge for change < 0', () => {
        const { getByText } = renderWithProviders(
            <PriceChangeBadge valuePercentageChange={-0.01} />,
            { providers: ['intl'] },
        );

        expect(getByText('-1.00%')).toHaveStyle({ color: colors.contentCritical });
    });

    it('should render skeleton when value is null', () => {
        const { getByTestId } = renderWithProviders(
            <PriceChangeBadge valuePercentageChange={null} />,
            { providers: ['intl'] },
        );

        expect(getByTestId('skeleton-box')).toBeTruthy();
    });

    it('should render 3 significant digits', () => {
        const { getByText } = renderWithProviders(
            <PriceChangeBadge valuePercentageChange={0.1234} />,
            { providers: ['intl'] },
        );

        expect(getByText('12.3%')).toBeTruthy();
    });
});
