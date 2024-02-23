import styled from 'styled-components';
import { NavigationTab } from './NavigationTab';

const Container = styled.div`
    display: flex;
    width: 100%;
    min-height: 57px;
    padding: 0 25px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */

    ::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }

    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
`;

export type NavPages = 'sign' | 'verify';

interface NavigationProps {
    page: NavPages;
    setPage: (page: NavPages) => void;
}

export const Navigation = ({ page, setPage }: NavigationProps) => (
    <Container>
        <NavigationTab
            title="TR_SIGN_MESSAGE"
            active={page === 'sign'}
            onClick={() => setPage('sign')}
            data-test="@sign-verify/navigation/sign"
        />
        <NavigationTab
            title="TR_VERIFY_MESSAGE"
            active={page === 'verify'}
            onClick={() => setPage('verify')}
            data-test="@sign-verify/navigation/verify"
        />
    </Container>
);
