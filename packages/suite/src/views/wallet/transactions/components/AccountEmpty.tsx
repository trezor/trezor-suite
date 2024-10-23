import { analytics, EventType } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { AccountExceptionLayout } from 'src/components/wallet';

interface AccountEmptyProps {
    account: Account;
}

export const AccountEmpty = ({ account }: AccountEmptyProps) => {
    const dispatch = useDispatch();
    const networkSymbol = account.symbol.toUpperCase();

    const handleNavigateToReceivePage = () => {
        dispatch(goto('wallet-receive', { preserveParams: true }));
        analytics.report({
            type: EventType.AccountsEmptyAccountReceive,
            payload: {
                symbol: networkSymbol.toLowerCase(),
            },
        });
    };
    const handleNavigateToBuyPage = () => {
        dispatch(goto('wallet-coinmarket-buy', { preserveParams: true }));

        analytics.report({
            type: EventType.AccountsEmptyAccountBuy,
            payload: {
                symbol: networkSymbol.toLowerCase(),
            },
        });
    };

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_IS_EMPTY_TITLE" />}
            description={
                <Translation
                    id="TR_ACCOUNT_IS_EMPTY_DESCRIPTION"
                    values={{ network: networkSymbol }}
                />
            }
            iconName="arrowsLeftRight"
            iconVariant="tertiary"
            actions={[
                {
                    'data-testid': '@accounts/empty-account/receive',
                    key: '1',
                    onClick: handleNavigateToReceivePage,
                    children: (
                        <Translation id="TR_RECEIVE_NETWORK" values={{ network: networkSymbol }} />
                    ),
                },
                {
                    'data-testid': '@accounts/empty-account/buy',
                    key: '2',
                    onClick: handleNavigateToBuyPage,
                    children: (
                        <Translation id="TR_BUY_NETWORK" values={{ network: networkSymbol }} />
                    ),
                },
            ]}
        />
    );
};
