import { mockNetworksServices } from '@suite-common/networks/mocks';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { BigNumber } from '@trezor/utils';

import { RevokeLimitInfoRow } from './RevokeLimitInfoRow';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

describe('RevokeLimitInfoRow', () => {
    const renderRevokeLimitInfoRow = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        renderWithTradingProvider(<RevokeLimitInfoRow />, {
            tradeType: 'exchange',
            overrides,
            services: { networks: mockNetworksServices() },
        });

    const withPreselectedQuote: PreloadedStatePartial<TradingTestPreloadedState> = {
        wallet: {
            trading: {
                exchange: {
                    selectedQuote: {
                        ...mercuryoFixedWorstQuote,
                        preapprovedStringAmount: '100',
                    },
                    tradingAccountKey: eth1NormalAccount.key,
                },
            },
        },
    };

    it('should render that new limit is 0', async () => {
        const { getByText } = await renderRevokeLimitInfoRow(withPreselectedQuote);

        expect(getByText('0 USDC')).toBeOnTheScreen();
    });

    it('should display preapprovedStringAmount', async () => {
        const { getByText } = await renderRevokeLimitInfoRow(withPreselectedQuote);

        expect(getByText('100 USDC')).toBeOnTheScreen();
    });

    it('should use token decimals to detect unlimited allowance', async () => {
        const amountUnlimitedOnlyWithEthDecimals = new BigNumber(UINT256_MAX)
            .dividedBy(2)
            .shiftedBy(-18)
            .integerValue(BigNumber.ROUND_CEIL)
            .toFixed();

        const { queryByText } = await renderRevokeLimitInfoRow({
            wallet: {
                trading: {
                    exchange: {
                        selectedQuote: {
                            ...mercuryoFixedWorstQuote,
                            preapprovedStringAmount: amountUnlimitedOnlyWithEthDecimals,
                        },
                        tradingAccountKey: eth1NormalAccount.key,
                    },
                },
            },
        });

        expect(queryByText('Unlimited USDC')).toBeNull();
    });

    it('should render nothing when no quote is set', async () => {
        const { toJSON } = await renderRevokeLimitInfoRow();

        expect(toJSON()).toBeNull();
    });
});
