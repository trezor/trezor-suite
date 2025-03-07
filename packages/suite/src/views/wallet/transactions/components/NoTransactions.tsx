import { Explorer } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';

import { Translation, TrezorLink } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

interface NoTransactionsProps {
    account: Account;
}

export const NoTransactions = ({ account }: NoTransactionsProps) => {
    const explorer = useSelector(state => selectExplorer(state, account.symbol)) as Explorer;
    const explorerUrl = `${getExplorerUrl(explorer, 'account')}${account.descriptor}${explorer.queryString ?? ''}`;

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
