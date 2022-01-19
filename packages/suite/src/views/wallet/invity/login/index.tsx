import React from 'react';
import { InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import { InvityLayoutProps } from '@suite/components/wallet/InvityLayout';

const CoinmarketSavingsLogin = ({ selectedAccount }: InvityLayoutProps) => (
    <InvityLayout selectedAccount={selectedAccount}>
        <p>Login</p>
        <iframe
            title="login"
            frameBorder="0"
            src={invityAPI.getLoginPageSrc()}
            sandbox="allow-scripts allow-forms allow-same-origin"
        />
    </InvityLayout>
);

export default withSelectedAccountLoaded(CoinmarketSavingsLogin, {
    title: 'TR_NAV_INVITY',
    redirectUnauthorizedUserToLogin: false,
});
