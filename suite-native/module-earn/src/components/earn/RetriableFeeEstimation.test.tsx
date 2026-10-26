import { type AccountKey } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { RetriableFeeEstimation } from './RetriableFeeEstimation';

jest.mock('@suite-native/transaction-management', () => ({
    FeeSelector: () => {
        const { Text } = jest.requireActual('react-native');

        return <Text>Estimated network fee</Text>;
    },
}));

describe('RetriableFeeEstimation', () => {
    it('explains a failed estimate and lets the user retry from the form', async () => {
        const retryFeeEstimation = jest.fn();
        const props = {
            accountKey: 'account-key' as AccountKey,
            formDraft: undefined,
            updateThunk: jest.fn(),
            retryFeeEstimation,
        };
        const { getByText, queryByText, rerender } = await renderWithStoreProvider(
            <RetriableFeeEstimation {...props} hasFeeEstimationError />,
        );

        expect(
            getByText(
                "The network fee couldn't be estimated, so the transaction can't be prepared. Try again later.",
            ),
        ).toBeTruthy();
        expect(queryByText('Estimated network fee')).toBeNull();
        await fireEvent.press(getByText('Try again'));
        expect(retryFeeEstimation).toHaveBeenCalledTimes(1);

        await rerender(<RetriableFeeEstimation {...props} hasFeeEstimationError={false} />);
        expect(getByText('Estimated network fee')).toBeTruthy();
    });
});
