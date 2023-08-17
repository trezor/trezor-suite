import { Button } from '@trezor/components';
import { AccountExceptionLayout } from 'src/components/wallet';
import { Translation, TrezorLink } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { getNetwork } from '@suite-common/wallet-utils';

interface NoTransactionsProps {
    account: Account;
}

export const NoTransactions = ({ account }: NoTransactionsProps) => {
    const network = getNetwork(account.symbol)!;
    const explorerUrl = `${network.explorer.account}${account.descriptor}${network.explorer.queryString}`;

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TRANSACTIONS_NOT_AVAILABLE" />}
            image="CLOUDY"
            actionComponent={
                <Button variant="primary" icon="EXTERNAL_LINK" iconAlignment="right">
                    <TrezorLink variant="nostyle" href={explorerUrl}>
                        <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />
                    </TrezorLink>
                </Button>
            }
        />
    );
};
