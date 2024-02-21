import { WalletLayoutNavigation, WalletLayoutNavLink } from 'src/components/wallet';

export type NavPages = 'sign' | 'verify';

interface NavigationProps {
    page: NavPages;
    setPage: (page: NavPages) => void;
}

export const Navigation = ({ page, setPage }: NavigationProps) => (
    <WalletLayoutNavigation>
        <WalletLayoutNavLink
            title="TR_SIGN_MESSAGE"
            active={page === 'sign'}
            onClick={() => setPage('sign')}
            data-test-id="@sign-verify/navigation/sign"
        />
        <WalletLayoutNavLink
            title="TR_VERIFY_MESSAGE"
            active={page === 'verify'}
            onClick={() => setPage('verify')}
            data-test-id="@sign-verify/navigation/verify"
        />
    </WalletLayoutNavigation>
);
