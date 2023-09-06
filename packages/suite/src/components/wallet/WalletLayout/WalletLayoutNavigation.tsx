import { ReactElement } from 'react';
import styled from 'styled-components';
import { WalletLayoutNavLinkProps } from './WalletLayoutNavLink';

const Navigation = styled.div`
    display: flex;
    width: 100%;
    min-height: 57px;
    padding: 0 25px;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }

    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

interface WalletLayoutNavigationProps {
    children: ReactElement<WalletLayoutNavLinkProps> | ReactElement<WalletLayoutNavLinkProps>[];
}

export const WalletLayoutNavigation = ({ children }: WalletLayoutNavigationProps) => (
    <Navigation>{children}</Navigation>
);
