import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';

import { AccountExceptionLayout } from 'src/components/wallet';
import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { type Account } from 'src/types/wallet';

interface AccountEmptyProps {
    account: Account;
}

export const AccountEmpty = ({ account }: AccountEmptyProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const isTokensNetwork = getNetworkFeatures(account.symbol).includes('tokens');

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const networkName = getNetwork(account.symbol).name;

    const handleNavigateToReceivePage = () => {
        dispatch(goto({ routeName: 'wallet-receive', preserveParams: true }));
        analytics.report({
            type: events.accountsEmptyAccountReceiveEvent.name,
            payload: {
                symbol: account.symbol,
            },
        });
    };
    const handleNavigateToBuyPage = () => {
        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account),
            ),
        );
        dispatch(goto({ routeName: 'wallet-trading-buy' }));

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'account/empty',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <AccountExceptionLayout
            data-testid="@accounts/empty-account"
            title={<Translation id="TR_ACCOUNT_IS_EMPTY_TITLE" />}
            description={
                isTokensNetwork ? (
                    <Translation
                        id="TR_ACCOUNT_WITH_TOKENS_IS_EMPTY_DESCRIPTION"
                        values={{ networkName, networkDisplaySymbol: displaySymbol }}
                    />
                ) : (
                    <Translation
                        id="TR_ACCOUNT_IS_EMPTY_DESCRIPTION"
                        values={{ network: displaySymbol }}
                    />
                )
            }
            iconName="arrowsLeftRight"
            iconVariant="neutral"
            actions={[
                {
                    'data-testid': '@accounts/empty-account/receive',
                    key: '1',
                    onClick: handleNavigateToReceivePage,
                    children: isTokensNetwork ? (
                        <Translation id="TR_RECEIVE" />
                    ) : (
                        <Translation
                            id="TR_RECEIVE_NETWORK"
                            values={{ networkDisplaySymbol: displaySymbol }}
                        />
                    ),
                },
                {
                    'data-testid': '@accounts/empty-account/buy',
                    key: '2',
                    onClick: handleNavigateToBuyPage,
                    children: isTokensNetwork ? (
                        <Translation id="TR_BUY" />
                    ) : (
                        <Translation
                            id="TR_BUY_NETWORK"
                            values={{ networkDisplaySymbol: displaySymbol }}
                        />
                    ),
                },
            ]}
        />
    );
};
