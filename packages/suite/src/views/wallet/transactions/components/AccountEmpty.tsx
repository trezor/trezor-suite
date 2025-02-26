import {
    getNetwork,
    getNetworkDisplaySymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

interface AccountEmptyProps {
    account: Account;
}

export const AccountEmpty = ({ account }: AccountEmptyProps) => {
    const dispatch = useDispatch();

    const isTokensNetwork = getNetworkFeatures(account.symbol).includes('tokens');

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const networkName = getNetwork(account.symbol).name;

    const handleNavigateToReceivePage = () => {
        dispatch(goto('wallet-receive', { preserveParams: true }));
        analytics.report({
            type: EventType.AccountsEmptyAccountReceive,
            payload: {
                symbol: account.symbol,
            },
        });
    };
    const handleNavigateToBuyPage = () => {
        dispatch(goto('wallet-trading-buy', { preserveParams: true }));

        analytics.report({
            type: EventType.AccountsEmptyAccountBuy,
            payload: {
                symbol: account.symbol,
            },
        });
    };

    return (
        <AccountExceptionLayout
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
            iconVariant="tertiary"
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
