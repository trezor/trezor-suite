import React from 'react';
import { WalletLayoutNavigation, WalletLayoutNavLink } from '@wallet-components';

export type NavPages = 'sign' | 'verify';

type Props = {
    page: NavPages;
    setPage: (page: NavPages) => void;
};

const Navigation = ({ page, setPage }: Props) => (
    <WalletLayoutNavigation>
        <WalletLayoutNavLink
            title="TR_SIGN_MESSAGE"
            active={page === 'sign'}
            onClick={() => setPage('sign')}
            data-test="@sign-verify/navigation/sign"
        />
        <WalletLayoutNavLink
            title="TR_VERIFY_MESSAGE"
            active={page === 'verify'}
            onClick={() => setPage('verify')}
            data-test="@sign-verify/navigation/verify"
        />
    </WalletLayoutNavigation>
);

export default Navigation;
