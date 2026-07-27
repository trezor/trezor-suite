import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { FeeOptionErrorMessage } from '../FeeOptionErrorMessage';

describe('FeeOptionErrorMessage', () => {
    const renderFeeOptionErrorMessage = (isVisible: boolean) =>
        renderWithBasicProvider(<FeeOptionErrorMessage isVisible={isVisible} />);

    it('should render error message when visible', () => {
        const { getByText, queryByTestId } = renderFeeOptionErrorMessage(true);

        expect(getByText(getTranslation('transactionManagement.fees.error'))).toBeOnTheScreen();
        expect(queryByTestId('@transactionManagement/fee-option-error-message')).toBeOnTheScreen();
    });

    it('should have height 0 when not visible', () => {
        const { queryByTestId } = renderFeeOptionErrorMessage(false);

        expect(queryByTestId('@transactionManagement/fee-option-error-message')).toBeNull();
    });
});
