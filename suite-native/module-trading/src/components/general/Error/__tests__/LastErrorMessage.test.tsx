import { tradingBuyActions } from '@suite-common/trading';
import { type TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils/store';

import { LastErrorMessage, LastErrorMessageProps } from '../LastErrorMessage';

describe('LastErrorMessage', () => {
    let store: TestStore;

    const renderLastErrorMessage = (props: LastErrorMessageProps) =>
        renderWithStoreProvider(<LastErrorMessage {...props} />, { store });

    beforeEach(() => {
        ({ store } = initStore());
    });

    it('should render nothing when no error is specified', () => {
        const { toJSON } = renderLastErrorMessage({ tradingType: 'buy' });

        expect(toJSON()).toBeNull();
    });

    it('should render the last error message for the specified trading type', () => {
        const errorMessage = 'An error occurred during the buy process';
        store.dispatch(tradingBuyActions.setLastErrorMessage(errorMessage));

        const { getByText } = renderLastErrorMessage({ tradingType: 'buy' });

        expect(getByText(errorMessage)).toBeOnTheScreen();
    });
});
