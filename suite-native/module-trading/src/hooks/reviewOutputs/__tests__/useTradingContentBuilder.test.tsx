import type { CryptoId } from 'invity-api';

import type {
    AccountKey,
    FormStateTradingCryptoCurrency,
    FormStateTradingFiatCurrency,
} from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';
import type { ReviewOutputItemContentDataProps } from '@suite-native/transaction-management';

import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { useTradingContentBuilder } from '../useTradingContentBuilder';

const mockSend: FormStateTradingCryptoCurrency = {
    cryptoId: 'bitcoin' as CryptoId,
    accountKey: undefined,
    symbol: 'btc',
    amount: '1.22',
};

const mockReceiveCrypto: FormStateTradingCryptoCurrency = {
    cryptoId: 'ethereum' as CryptoId,
    accountKey: btc1NormalAccount.key,
    symbol: 'eth',
    amount: '0.462586',
};

const mockReceiveFiat: FormStateTradingFiatCurrency = {
    amount: '1500',
    fiatCurrency: 'USD',
};

const baseProps: ReviewOutputItemContentDataProps = {
    accountKey: 'account-key' as AccountKey,
    outputType: 'traded_assets',
    value: '',
    send: mockSend,
    receive: mockReceiveCrypto,
};

describe('useTradingContentBuilder', () => {
    const ContentBuilderWrapper = ({
        props,
    }: {
        props: Partial<ReviewOutputItemContentDataProps>;
    }) => {
        const contentBuilder = useTradingContentBuilder();

        return <>{contentBuilder({ ...baseProps, ...props })}</>;
    };

    const renderContentBuilder = (props: Partial<ReviewOutputItemContentDataProps> = {}) =>
        renderWithTradingProvider(<ContentBuilderWrapper props={props} />, {
            tradeType: 'exchange',
        });

    it('returns undefined for non-traded_assets output type', () => {
        const { toJSON } = renderContentBuilder({ outputType: 'note' });

        expect(toJSON()).toBeNull();
    });

    it('returns undefined when send is missing', () => {
        const { toJSON } = renderContentBuilder({ send: undefined });

        expect(toJSON()).toBeNull();
    });

    it('renders the send leg only for a partial swap (receive missing)', () => {
        const { getByText, queryByText } = renderContentBuilder({ receive: undefined });

        expect(getByText('-1.22 BTC')).toBeOnTheScreen();
        expect(queryByText('+0.45796014 ETH')).toBeNull();
        expect(
            queryByText(
                getTranslation('moduleTrading.tradingReviewOutputs.tradedAssets.recipient'),
            ),
        ).toBeNull();
    });

    it('returns undefined when receive is fiat (no cryptoId)', () => {
        const { toJSON } = renderContentBuilder({ receive: mockReceiveFiat });

        expect(toJSON()).toBeNull();
    });

    it('renders send amount with minus prefix', () => {
        const { getByText } = renderContentBuilder();

        expect(getByText('-1.22 BTC')).toBeOnTheScreen();
    });

    it('renders receive amount adjusted by slippage with plus prefix', () => {
        const { getByText } = renderContentBuilder();

        expect(getByText('+0.45796014 ETH')).toBeOnTheScreen();
    });

    describe('recipient row', () => {
        it('renders recipient label and address when receive account is found', () => {
            const { getByText } = renderContentBuilder({});

            expect(
                getByText(
                    getTranslation('moduleTrading.tradingReviewOutputs.tradedAssets.recipient'),
                ),
            ).toBeOnTheScreen();
            expect(getByText(btc1NormalAccount.descriptor)).toBeOnTheScreen();
        });

        it('does not render recipient row when receive account is not found', () => {
            const { queryByText } = renderContentBuilder({
                receive: {
                    ...mockReceiveCrypto,
                    accountKey: 'non-existent-account-key' as AccountKey,
                },
            });

            expect(
                queryByText(
                    getTranslation('moduleTrading.tradingReviewOutputs.tradedAssets.recipient'),
                ),
            ).toBeNull();
        });
    });
});
