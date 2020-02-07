import React from 'react';
import { H2, P } from '@trezor/components-v2';
import { ChildProps } from '../../index';

interface Props {
    account: ChildProps['account'];
}

export default ({ account }: Props) => {
    if (account.networkType === 'bitcoin') {
        return (
            <>
                <H2>Receive {account.symbol.toUpperCase()}</H2>
                <P size="tiny">
                    To receive any funds you need to get a fresh receive address. It is advised to
                    always use a fresh one as this prevents anyone else to track your transactions.
                    You can reuse an address but we recommend not doing it unless it is necessary.
                </P>
            </>
        );
    }
    if (account.networkType === 'ethereum') {
        return (
            <>
                <H2>Receive {account.symbol.toUpperCase()}</H2>
                <P size="tiny">Use this address to receive tokens as well.</P>
            </>
        );
    }
    return <H2>Receive {account.symbol.toUpperCase()}</H2>;
};
