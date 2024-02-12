import { ReactNode } from 'react';
import styled from 'styled-components';
import { CoinLogo, CoinType, Paragraph } from '@trezor/components';

const Flex = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
`;

interface NetworkBadgeProps {
    logo: CoinType;
    name: ReactNode;
}

export const NetworkBadge = ({ logo, name }: NetworkBadgeProps) => (
    <Flex>
        <CoinLogo symbol={logo} size={16} />
        <Paragraph>{name}</Paragraph>
    </Flex>
);
