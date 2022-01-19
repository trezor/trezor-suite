import React from 'react';
import { WithInvityLayoutProps, InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import invityAPI from '@suite-services/invityAPI';
import { getRoute } from '@suite-utils/router';

type CoinmarketSavingsLoginRgistrationProps = WithInvityLayoutProps;

const CoinmarketSavingsRegistration = ({
    selectedAccount,
}: CoinmarketSavingsLoginRgistrationProps) => {
    const afterVerificationReturnToPath = getRoute('wallet-invity-account-verified', {
        symbol: selectedAccount.account.symbol,
        accountIndex: selectedAccount.account.index,
        accountType: selectedAccount.account.accountType,
    });
    return (
        <InvityLayout selectedAccount={selectedAccount}>
            <p>Registration</p>
            <iframe
                title="registration"
                frameBorder="0"
                src={invityAPI.getRegistrationPageSrc(afterVerificationReturnToPath)}
                sandbox="allow-scripts allow-forms allow-same-origin"
            />
        </InvityLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSavingsRegistration, {
    title: 'TR_NAV_INVITY',
});
