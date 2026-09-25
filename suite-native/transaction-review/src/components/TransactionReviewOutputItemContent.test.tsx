import {
    type TransactionReviewOutputType,
    type TransactionReviewStatefulOutput,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Text as MockText } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { within } from '@suite-native/test-utils-store';

import { TransactionReviewOutputItemContent } from './TransactionReviewOutputItemContent';
import { renderWithTransactionReview } from '../__fixtures__/renderWithTransactionReview';
import { ETH_ACCOUNT_KEY, USDC_CONTRACT } from '../__fixtures__/walletState';

jest.mock('./TransactionReviewOutputItemValues', () => ({
    TransactionReviewOutputItemValues: ({
        accountKey,
        tokenContract,
        translationKey,
        value,
    }: {
        accountKey: string;
        tokenContract?: string;
        translationKey: string;
        value: string;
    }) => (
        <MockText>
            Values: [{accountKey}]-[{tokenContract ?? 'no-token'}]-[{translationKey}]-[{value}]
        </MockText>
    ),
}));

const CONTENT_TEST_ID = 'content';

// Casting keeps the table-driven cases readable; the union has different
// value shapes per type and every case here carries a plain `value`.
const output = (
    type: TransactionReviewOutputType,
    value: string,
    state: TransactionReviewStatefulOutput['state'] = 'active',
) => ({ type, value, state }) as TransactionReviewStatefulOutput;

describe('TransactionReviewOutputItemContent', () => {
    const renderContent = async (
        reviewOutput: TransactionReviewStatefulOutput,
        providerProps = {},
    ) =>
        await renderWithTransactionReview(
            <MockText testID={CONTENT_TEST_ID}>
                <TransactionReviewOutputItemContent output={reviewOutput} />
            </MockText>,
            { providerProps },
        );

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    it('should render nothing when the account is unknown', async () => {
        const { getByTestId } = await renderContent(output('note', 'hello'), {
            accountKey: mockAccountKey({ descriptor: 'unknown' }),
        });

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent('');
    });

    it('should forward the review account and token to the amount row', async () => {
        const { getByTestId } = await renderContent(output('amount', '1000'), {
            tokenContract: USDC_CONTRACT,
        });

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            `Values: [${ETH_ACCOUNT_KEY}]-[${USDC_CONTRACT}]-[transactionManagement.review.outputs.amountLabel]-[1000]`,
        );
    });

    it('should render the amount row without a token when the review has none', async () => {
        const { getByTestId } = await renderContent(output('amount', '1000'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            `Values: [${ETH_ACCOUNT_KEY}]-[no-token]-[transactionManagement.review.outputs.amountLabel]-[1000]`,
        );
    });

    it('should render the destination tag value when set', async () => {
        const { getByTestId } = await renderContent(output('destination-tag', '12345'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent('12345');
    });

    it('should render the not-set placeholder for an empty destination tag', async () => {
        const { getByTestId } = await renderContent(output('destination-tag', ''));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.destinationTagNotSet'),
        );
    });

    it.each<TransactionReviewOutputType>(['address', 'regular_legacy', 'contract', 'signing-with'])(
        'should render a chunked address for type "%s"',
        async type => {
            const { getByTestId } = await renderContent(
                output(type, '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'),
            );

            expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
                '0x de0B 2956 69a9 FD93 d5F2 8D9E c85E 40f4 cb69 7BAe',
            );
        },
    );

    it('should render the no-restriction text for type "timebounds"', async () => {
        const { getByTestId } = await renderContent(output('timebounds', ''));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.timeboundsNotSet'),
        );
    });

    it('should render the testnet text for type "network"', async () => {
        const { getByTestId } = await renderContent(output('network', ''));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.networkTestnet'),
        );
    });

    it('should render hex data for type "data"', async () => {
        const { getByTestId } = await renderContent(output('data', '0xabcd'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent('0xabcd');
    });

    it('should truncate long hex data and offer a show-more control', async () => {
        const { getByTestId } = await renderContent(output('data', 'd'.repeat(301)));

        const content = getByTestId(CONTENT_TEST_ID);

        expect(within(content).getByText('d'.repeat(300))).toBeOnTheScreen();
        expect(
            within(content).getByText(
                getTranslation('transactionManagement.review.outputs.transactionDataShowMore'),
            ),
        ).toBeOnTheScreen();
    });

    it('should render the empty placeholder for type "data" without value', async () => {
        const { getByTestId } = await renderContent(output('data', ''));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.transactionDataEmpty'),
        );
    });

    it.each<TransactionReviewOutputType>(['recipient_name', 'note'])(
        'should render the raw value for type "%s"',
        async type => {
            const { getByTestId } = await renderContent(output(type, 'plain value'));

            expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent('plain value');
        },
    );

    it('should render the fee limit row in SUN for type "fee-limit"', async () => {
        const { getByTestId } = await renderContent(output('fee-limit', '15000'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            `${getTranslation('transactionManagement.review.outputs.feeLimitLabel')}${Number('15000').toLocaleString()} SUN`,
        );
    });

    it('should render the translated swap intent for value "swap"', async () => {
        const { getByTestId } = await renderContent(output('swap_intent', 'swap'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.swapIntentValue'),
        );
    });

    it('should render the raw swap intent for other values', async () => {
        const { getByTestId } = await renderContent(output('swap_intent', 'bridge'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent('bridge');
    });

    it.each<TransactionReviewOutputType>([
        'opreturn',
        'locktime',
        'fee',
        'txid',
        'gas',
        'approve_data',
        'traded_assets',
    ])('should warn and render nothing for unsupported type "%s"', async type => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const { getByTestId } = await renderContent(output(type, 'mockvalue'));

        expect(getByTestId(CONTENT_TEST_ID)).toHaveTextContent('');
        expect(warnSpy).toHaveBeenCalledWith(
            `ReviewOutputItemContent: Unsupported output type "${type}" with value "mockvalue".`,
        );
    });
});
