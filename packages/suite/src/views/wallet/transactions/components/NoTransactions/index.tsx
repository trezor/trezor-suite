import React from 'react';
import { Button } from '@trezor/components';
import { AccountExceptionLayout } from '@wallet-components';
import { Translation, TrezorLink } from '@suite-components';
import { Account } from '@wallet-types';
import { getNetwork } from '@wallet-utils/accountUtils';

interface Props {
    account: Account;
}

const NoTransactions = ({ account }: Props) => {
    const network = getNetwork(account.symbol)!;
    const explorerUrl = `${network.explorer.account}${account.descriptor}`;
    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TRANSACTIONS_NOT_AVAILABLE" />}
            image="CLOUDY"
            actionComponent={
                <Button variant="primary" icon="EXTERNAL_LINK" alignIcon="right">
                    <TrezorLink variant="nostyle" href={explorerUrl}>
                        <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />
                    </TrezorLink>
                </Button>
            }
        />
    );
};

export default NoTransactions;
