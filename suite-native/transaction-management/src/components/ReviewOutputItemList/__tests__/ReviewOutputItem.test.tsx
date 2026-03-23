import { type AccountKey } from '@suite-common/wallet-types';
import { Text as MockText } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { type StatefulReviewOutput } from '../../../types';
import { ReviewOutputItem, type ReviewOutputItemProps } from '../ReviewOutputItem';

jest.mock('../ReviewOutputItemValues', () => ({
    ReviewOutputItemValues: ({
        translationKey,
        value,
    }: {
        translationKey: string;
        value: string;
    }) => (
        <MockText>
            ReviewOutputItemValues: [{translationKey}]-[{value}]
        </MockText>
    ),
}));

describe('ReviewOutputItem', () => {
    const renderReviewOutputItem = (props: Partial<ReviewOutputItemProps>) =>
        renderWithBasicProvider(
            <ReviewOutputItem
                accountKey={
                    'eth-account-1' as AccountKey // Todo: create properly via `createAccountKey()`
                }
                onLayout={jest.fn()}
                reviewOutput={{
                    type: 'address',
                    value: 'mockvalue',
                    state: 'active',
                }}
                {...props}
            />,
        );

    it.each<[StatefulReviewOutput['type'], string]>([
        ['opreturn', 'opreturn'],
        ['data', 'data'],
        ['locktime', 'locktime'],
        ['fee', 'fee'],
        ['destination-tag', 'Destination tag'],
        ['signing-with', 'Signing with'],
        ['network', 'Network'],
        ['timebounds', 'TimeBounds'],
        ['txid', 'txid'],
        ['address', 'Recipient address'],
        ['amount', 'Amount'],
        ['gas', 'gas'],
        ['contract', 'Token address'],
        ['regular_legacy', 'Recipient address'],
        ['approve_data', 'approve_data'],
        ['recipient_name', 'recipient_name'],
    ])('should display title based on type [%s]', (type, expectedTitle) => {
        // Suppress console warnings for unsupported types
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type,
                value: 'mockvalue',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/title')).toHaveTextContent(expectedTitle);
    });

    it('should render ReviewOutputItemValues component for type "amount"', () => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type: 'amount',
                value: 'mockvalue',
                state: 'active',
            } as StatefulReviewOutput,
        });

        // note that this test mocks the ReviewOutputItemValues component
        expect(getByTestId('review-output-card/content')).toHaveTextContent(
            'ReviewOutputItemValues: [transactionManagement.review.outputs.amountLabel]-[mockvalue]',
        );
    });

    it('should render value for type "destination-tag" and value set', () => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type: 'destination-tag',
                value: 'mockvalue',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent('mockvalue');
    });

    it('should render tag not set placeholder for type "destination-tag" and empty value', () => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type: 'destination-tag',
                value: '',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent(
            "Memo/Destination tag isn't set",
        );
    });

    it.each<StatefulReviewOutput['type']>([
        'address',
        'regular_legacy',
        'contract',
        'signing-with',
    ])('should render chunked value for type "%s"', type => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type,
                value: 'mockvalue',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent('mock valu e');
    });

    it('should render "No restriction" for type "timebounds"', () => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type: 'timebounds',
                value: '',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent('No restriction');
    });

    it('should render Testnet info for type "network"', () => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type: 'network',
                value: '',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent(
            'Transaction is on testnet network',
        );
    });

    it.each<StatefulReviewOutput['type']>([
        'opreturn',
        'data',
        'locktime',
        'fee',
        'txid',
        'gas',
        'approve_data',
        'recipient_name',
    ])('should render no content for type', type => {
        const warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type,
                value: 'mockvalue',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent('');
        expect(warningSpy).toHaveBeenCalledWith(
            `ReviewOutputItemContent: Unsupported output type "${type}" with value "mockvalue".`,
        );
    });
});
