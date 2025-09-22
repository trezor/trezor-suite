import { ReactNode } from 'react';

import styled from 'styled-components';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { FlexProps, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

const OptionRowStyled = styled.div<{ $disabled: boolean }>`
    &:hover {
        background: ${({ theme, $disabled }) => !$disabled && theme.backgroundSurfaceElevation0};
    }
`;

interface TradingReceiveAccountOptionRowProps {
    children?: ReactNode;
    onClick?: () => void;
}

export const TradingReceiveAccountOptionRow = ({
    children,
    onClick,
    ...props
}: TradingReceiveAccountOptionRowProps & FlexProps) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    return (
        <OptionRowStyled $disabled={isDiscoveryRunning}>
            <Row
                gap={spacings.sm}
                padding={{ vertical: spacings.md, horizontal: spacings.lg }}
                cursor={isDiscoveryRunning ? 'not-allowed' : 'pointer'}
                onClick={isDiscoveryRunning ? undefined : onClick}
                {...props}
            >
                {children}
            </Row>
        </OptionRowStyled>
    );
};
