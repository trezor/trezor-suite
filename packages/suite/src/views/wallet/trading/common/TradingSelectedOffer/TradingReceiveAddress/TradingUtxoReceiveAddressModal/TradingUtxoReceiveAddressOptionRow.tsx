import { ReactNode } from 'react';

import styled from 'styled-components';

import { FlexProps, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

const OptionRowStyled = styled.div`
    &:hover {
        background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    }
`;

interface TradingUtxoReceiveAddressOptionRowProps {
    children?: ReactNode;
    onClick?: () => void;
}

export const TradingUtxoReceiveAddressOptionRow = ({
    children,
    onClick,
    ...props
}: TradingUtxoReceiveAddressOptionRowProps & FlexProps) => (
    <OptionRowStyled>
        <Row
            gap={spacings.sm}
            padding={{ vertical: spacings.md, horizontal: spacings.lg }}
            cursor="pointer"
            onClick={onClick}
            {...props}
        >
            {children}
        </Row>
    </OptionRowStyled>
);
