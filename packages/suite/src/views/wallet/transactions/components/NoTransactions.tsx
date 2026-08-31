import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { type Explorer } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { CloudIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';
import { type Account } from 'src/types/wallet';
interface NoTransactionsProps {
    account: Account;
}

export const NoTransactions = ({ account }: NoTransactionsProps) => {
    const explorer = useSelector(state => selectExplorer(state, account.symbol)) as Explorer;
    const explorerUrl = `${getExplorerUrl(explorer, 'address')}${account.descriptor}${explorer.queryString ?? ''}`;
    const href = useExternalLink(explorerUrl);

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TRANSACTIONS_NOT_AVAILABLE" />}
            icon={CloudIcon}
            iconVariant="info"
            actions={
                !isUtxoBased(account)
                    ? [
                          {
                              key: '1',
                              href,
                              children: <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />,
                          },
                      ]
                    : undefined
            }
        />
    );
};
