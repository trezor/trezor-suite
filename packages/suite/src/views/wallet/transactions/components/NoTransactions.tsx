import { AccountExceptionLayout } from 'src/components/wallet';
import { Translation, TrezorLink } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { getNetwork } from '@suite-common/wallet-config';

interface NoTransactionsProps {
    account: Account;
}

export const NoTransactions = ({ account }: NoTransactionsProps) => {
    const network = getNetwork(account.symbol);

    const explorerUrl = `${network.explorer.account}${account.descriptor}${network.explorer.queryString ?? ''}`;

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TRANSACTIONS_NOT_AVAILABLE" />}
            iconName="cloud"
            iconVariant="info"
            actions={[
                {
                    key: '1',
                    icon: 'arrowUpRight',
                    children: (
                        <TrezorLink variant="nostyle" href={explorerUrl}>
                            <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />
                        </TrezorLink>
                    ),
                },
            ]}
        />
    );
};
