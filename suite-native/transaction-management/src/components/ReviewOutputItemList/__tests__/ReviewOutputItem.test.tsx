import { type AccountKey } from '@suite-common/wallet-types';
import { Text as MockText } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, within } from '@suite-native/test-utils';

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
        [
            'destination-tag',
            getTranslation('transactionManagement.review.outputs.destinationTagLabel'),
        ],
        ['signing-with', getTranslation('transactionManagement.review.outputs.signingWithLabel')],
        ['network', getTranslation('transactionManagement.review.outputs.networkLabel')],
        ['timebounds', getTranslation('transactionManagement.review.outputs.timeboundsLabel')],
        ['txid', 'txid'],
        ['address', getTranslation('transactionManagement.review.outputs.addressLabel')],
        ['amount', getTranslation('transactionManagement.review.outputs.amountLabel')],
        ['gas', 'gas'],
        ['contract', getTranslation('transactionManagement.review.outputs.contractLabel')],
        ['regular_legacy', getTranslation('transactionManagement.review.outputs.addressLabel')],
        ['approve_data', getTranslation('transactionManagement.review.outputs.approveLabel')],
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
            getTranslation('transactionManagement.review.outputs.destinationTagNotSet'),
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
                value: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent(
            '0x de0B 2956 69a9 FD93 d5F2 8D9E c85E 40f4 cb69 7BAe',
        );
    });

    it('should render "No restriction" for type "timebounds"', () => {
        const { getByTestId } = renderReviewOutputItem({
            reviewOutput: {
                type: 'timebounds',
                value: '',
                state: 'active',
            } as StatefulReviewOutput,
        });

        expect(getByTestId('review-output-card/content')).toHaveTextContent(
            getTranslation('transactionManagement.review.outputs.timeboundsNotSet'),
        );
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
            getTranslation('transactionManagement.review.outputs.networkTestnet'),
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

    describe('exchange approval flow', () => {
        it('should render Token approval for type "address"', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    type: 'address',
                    value: '0x1234567890abcdef1234567890abcdef12345678',
                    state: 'active',
                },
                flowType: 'approve',
            });

            expect(getByTestId('review-output-card/title')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.tokenApprovalLabel'),
            );
            expect(getByTestId('review-output-card/content')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.tokenApprovalDescription'),
            );
        });

        it('should render "Approve to" for type "contract"', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    state: undefined,
                    type: 'contract',
                    value: '1inch Aggregation Router V6',
                },
                flowType: 'approve',
            });

            expect(getByTestId('review-output-card/title')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.approveToLabel'),
            );
            expect(getByTestId('review-output-card/content')).toHaveTextContent(
                '1inch Aggregation Router V6',
            );
        });

        it('should render Approve info for type "approve_data"', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    state: undefined,
                    token: {
                        balance: '33.231005',
                        contract: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
                        decimals: 6,
                        name: 'Aave Ethereum USDC',
                        standard: 'ERC20',
                        symbol: 'aEthUSDC',
                    },
                    type: 'approve_data',
                    value: '20000000',
                    value2: 'Ethereum',
                },
                flowType: 'approve',
            });

            const content = getByTestId('review-output-card/content');

            expect(getByTestId('review-output-card/title')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.approveLabel'),
            );
            expect(
                within(content).getByText(
                    getTranslation('transactionManagement.review.outputs.amountAllowanceLabel'),
                ),
            ).toBeTruthy();
            expect(within(content).getByText('20 aEthUSDC')).toBeTruthy();
            expect(
                within(content).getByText(
                    getTranslation('transactionManagement.review.outputs.chainLabel'),
                ),
            ).toBeTruthy();
            expect(within(content).getByText('Ethereum')).toBeTruthy();
        });

        it('should not render Chain row for type "approve_data" when value2 is absent', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    state: undefined,
                    token: {
                        balance: '33.231005',
                        contract: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
                        decimals: 6,
                        name: 'Aave Ethereum USDC',
                        standard: 'ERC20',
                        symbol: 'aEthUSDC',
                    },
                    type: 'approve_data',
                    value: '20000000',
                },
                flowType: 'approve',
            });

            const content = getByTestId('review-output-card/content');

            expect(
                within(content).getByText(
                    getTranslation('transactionManagement.review.outputs.amountAllowanceLabel'),
                ),
            ).toBeTruthy();
            expect(
                within(content).queryByText(
                    getTranslation('transactionManagement.review.outputs.chainLabel'),
                ),
            ).toBeNull();
        });
    });

    describe('exchange revoke flow', () => {
        it('should render Token revoke for type "address"', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    type: 'address',
                    value: '0x1234567890abcdef1234567890abcdef12345678',
                    state: 'active',
                },
                flowType: 'revoke',
            });

            expect(getByTestId('review-output-card/title')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.tokenRevocationLabel'),
            );
            expect(getByTestId('review-output-card/content')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.tokenRevocationDescription'),
            );
        });

        it('should render "Approve to" for type "contract"', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    state: undefined,
                    type: 'contract',
                    value: '1inch Aggregation Router V6',
                },
                flowType: 'revoke',
            });

            expect(getByTestId('review-output-card/title')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.revokeApprovalFromLabel'),
            );
            expect(getByTestId('review-output-card/content')).toHaveTextContent(
                '1inch Aggregation Router V6',
            );
        });

        it('should render Revoke info for type "approve_data"', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    state: undefined,
                    token: {
                        balance: '33.231005',
                        contract: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
                        decimals: 6,
                        name: 'Aave Ethereum USDC',
                        standard: 'ERC20',
                        symbol: 'aEthUSDC',
                    },
                    type: 'approve_data',
                    value: '20000000',
                    value2: 'Ethereum',
                },
                flowType: 'revoke',
            });

            const content = getByTestId('review-output-card/content');

            expect(getByTestId('review-output-card/title')).toHaveTextContent(
                getTranslation('transactionManagement.review.outputs.revokeLabel'),
            );
            expect(
                within(content).getByText(
                    getTranslation('transactionManagement.review.outputs.tokenLabel'),
                ),
            ).toBeTruthy();
            expect(within(content).getByText('aEthUSDC')).toBeTruthy();
            expect(
                within(content).getByText(
                    getTranslation('transactionManagement.review.outputs.chainLabel'),
                ),
            ).toBeTruthy();
            expect(within(content).getByText('Ethereum')).toBeTruthy();
        });

        it('should not render Chain row for type "approve_data" when value2 is absent', () => {
            const { getByTestId } = renderReviewOutputItem({
                reviewOutput: {
                    state: undefined,
                    token: {
                        balance: '33.231005',
                        contract: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
                        decimals: 6,
                        name: 'Aave Ethereum USDC',
                        standard: 'ERC20',
                        symbol: 'aEthUSDC',
                    },
                    type: 'approve_data',
                    value: '20000000',
                },
                flowType: 'revoke',
            });

            const content = getByTestId('review-output-card/content');

            expect(
                within(content).getByText(
                    getTranslation('transactionManagement.review.outputs.tokenLabel'),
                ),
            ).toBeTruthy();
            expect(
                within(content).queryByText(
                    getTranslation('transactionManagement.review.outputs.chainLabel'),
                ),
            ).toBeNull();
        });
    });
});
