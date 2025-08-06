import { renderWithBasicProvider } from '@suite-native/test-utils';

import { FeeOptionErrorMessage } from '../FeeOptionErrorMessage';

describe('FeeOptionErrorMessage', () => {
    const renderFeeOptionErrorMessage = (isVisible: boolean) =>
        renderWithBasicProvider(<FeeOptionErrorMessage isVisible={isVisible} />);

    it('should render error message when visible', () => {
        const { getByText, queryByTestId } = renderFeeOptionErrorMessage(true);

        expect(getByText('You don’t have enough balance to use this fee.')).toBeTruthy();
        expect(queryByTestId('@transactionManagement/fee-option-error-message')).toBeTruthy();
    });

    it('should have height 0 when not visible', () => {
        const { queryByTestId } = renderFeeOptionErrorMessage(false);

        expect(queryByTestId('@transactionManagement/fee-option-error-message')).toBeNull();
    });
});
