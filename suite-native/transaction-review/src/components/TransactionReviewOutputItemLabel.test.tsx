import { type TransactionReviewOutputType } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TransactionReviewOutputItemLabel } from './TransactionReviewOutputItemLabel';

describe('TransactionReviewOutputItemLabel', () => {
    const renderLabel = async (type: TransactionReviewOutputType) =>
        await renderWithBasicProvider(
            <Text testID="label">
                <TransactionReviewOutputItemLabel type={type} />
            </Text>,
        );

    it.each<[TransactionReviewOutputType, string]>([
        ['address', getTranslation('transactionManagement.review.outputs.addressLabel')],
        ['regular_legacy', getTranslation('transactionManagement.review.outputs.addressLabel')],
        ['amount', getTranslation('transactionManagement.review.outputs.amountLabel')],
        [
            'destination-tag',
            getTranslation('transactionManagement.review.outputs.destinationTagLabel'),
        ],
        ['contract', getTranslation('transactionManagement.review.outputs.contractLabel')],
        ['data', getTranslation('transactionManagement.review.outputs.transactionDataLabel')],
        [
            'recipient_name',
            getTranslation('transactionManagement.review.outputs.recipientProviderNameOutputLabel'),
        ],
        [
            'traded_assets',
            getTranslation('transactionManagement.review.outputs.tradedAssetsOutputLabel'),
        ],
        ['timebounds', getTranslation('transactionManagement.review.outputs.timeboundsLabel')],
        ['signing-with', getTranslation('transactionManagement.review.outputs.signingWithLabel')],
        ['network', getTranslation('transactionManagement.review.outputs.networkLabel')],
        ['approve_data', getTranslation('transactionManagement.review.outputs.approveLabel')],
        ['fee-limit', getTranslation('transactionManagement.review.outputs.feeLimitSummaryLabel')],
        ['note', getTranslation('transactionManagement.review.outputs.noteLabel')],
        ['swap_intent', getTranslation('transactionManagement.review.outputs.swapIntentLabel')],
    ])('should render translated label for type "%s"', async (type, expectedLabel) => {
        const { getByTestId } = await renderLabel(type);

        expect(getByTestId('label')).toHaveTextContent(expectedLabel);
    });

    it.each<TransactionReviewOutputType>(['opreturn', 'locktime', 'fee', 'txid', 'gas'])(
        'should fall back to the raw type for unsupported type "%s"',
        async type => {
            const { getByTestId } = await renderLabel(type);

            expect(getByTestId('label')).toHaveTextContent(type);
        },
    );
});
