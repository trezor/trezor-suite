import React from 'react';
import { withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { Button } from '@trezor/components';

const AccountVerified = ({ selectedAccount }: WithInvityLayoutProps) => {
    const { navigateToInvityLogin } = useInvityNavigation(selectedAccount.account);
    return (
        <>
            Your account has been verified.
            <Button onClick={() => navigateToInvityLogin()}>Navigate to Login</Button>
        </>
    );
};

export default withInvityLayout(AccountVerified, {
    redirectUnauthorizedUserToLogin: false,
});
