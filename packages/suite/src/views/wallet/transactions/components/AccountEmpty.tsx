import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import { ArrowDownIcon, ArrowsLeftRightIcon, CurrencyCircleDollarIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';
import { useDispatch } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
interface AccountEmptyProps {
    account: Account;
}

export const AccountEmpty = ({ account }: AccountEmptyProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

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
            icon={ArrowsLeftRightIcon}
            iconVariant="neutral"
            actions={[
                {
                    'data-testid': '@accounts/empty-account/buy',
                    key: '1',
                    onClick: handleNavigateToBuyPage,
                    iconLeft: CurrencyCircleDollarIcon,
                    size: 'medium',
                    children: isTokensNetwork ? (
                        <Translation id="TR_BUY" />
                    ) : (
                        <Translation
                            id="TR_BUY_NETWORK"
                            values={{ networkDisplaySymbol: displaySymbol }}
                        />
                    ),
                },
                {
                    'data-testid': '@accounts/empty-account/receive',
                    key: '2',
                    onClick: handleNavigateToReceivePage,
                    iconLeft: ArrowDownIcon,
                    size: 'medium',
                    children: isTokensNetwork ? (
                        <Translation id="TR_RECEIVE" />
                    ) : (
                        <Translation
                            id="TR_RECEIVE_NETWORK"
                            values={{ networkDisplaySymbol: displaySymbol }}
                        />
                    ),
                },
            ]}
        />
    );
};
