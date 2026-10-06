import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { FeeOptionErrorMessage } from './FeeOptionErrorMessage';

describe('FeeOptionErrorMessage', () => {
    const renderFeeOptionErrorMessage = async (isVisible: boolean) =>
        await renderWithBasicProvider(<FeeOptionErrorMessage isVisible={isVisible} />);

    it('should render error message when visible', async () => {
        const { getByText, queryByTestId } = await renderFeeOptionErrorMessage(true);

        expect(getByText(getTranslation('transactionManagement.fees.error'))).toBeOnTheScreen();
        expect(queryByTestId('@transactionManagement/fee-option-error-message')).toBeOnTheScreen();
    });

    it('should have height 0 when not visible', async () => {
        const { queryByTestId } = await renderFeeOptionErrorMessage(false);

        expect(queryByTestId('@transactionManagement/fee-option-error-message')).toBeNull();
    });
});
