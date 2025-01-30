import { BasicProvider, render, renderHook } from '@suite-native/test-utils';
import { NativeStyleUtils, useNativeStyles } from '@trezor/styles';

import { Box as MockBox } from '../Box';
import { PriceChangeBadge } from '../PriceChangeBadge';

jest.mock('../Skeleton/BoxSkeleton', () => ({
    BoxSkeleton: () => <MockBox testID="skeleton-box" />,
}));

describe('PriceChangeBadge', () => {
    let colors: NativeStyleUtils['colors'];

    beforeAll(() => {
        const { result } = renderHook(() => useNativeStyles(), { wrapper: BasicProvider });
        ({ colors } = result.current.utils);
    });

    it('should render green badge for change > 0', () => {
        const { getByText } = render(<PriceChangeBadge valuePercentageChange={0.01} />);

        expect(getByText('1.00%')).toHaveStyle({ color: colors.textPrimaryDefault });
    });

    it('should render green badge for change = 0', () => {
        const { getByText } = render(<PriceChangeBadge valuePercentageChange={0} />);

        expect(getByText('0.00%')).toHaveStyle({ color: colors.textPrimaryDefault });
    });

    it('should render red badge for change < 0', () => {
        const { getByText } = render(<PriceChangeBadge valuePercentageChange={-0.01} />);

        expect(getByText('-1.00%')).toHaveStyle({ color: colors.textAlertRed });
    });

    it('should render skeleton when value is null', () => {
        const { getByTestId } = render(<PriceChangeBadge valuePercentageChange={null} />);

        expect(getByTestId('skeleton-box')).toBeDefined();
    });

    it('should render 3 significant digits', () => {
        const { getByText } = render(<PriceChangeBadge valuePercentageChange={0.1234} />);

        expect(getByText('12.3%')).toBeDefined();
    });
});
