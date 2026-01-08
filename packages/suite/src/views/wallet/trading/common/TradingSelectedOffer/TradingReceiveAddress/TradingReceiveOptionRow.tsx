import { ReactNode } from 'react';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { GhostContainer, Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type TradingReceiveOptionRowProps = {
    children?: ReactNode;
    onClick?: () => void;
};

export const TradingReceiveOptionRow = ({
    children,
    onClick,
    ...props
}: TradingReceiveOptionRowProps) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    return (
        <GhostContainer
            isDisabled={isDiscoveryRunning}
            onClick={onClick}
            padding={{ vertical: 8, horizontal: 8 }}
            margin={{ horizontal: -8 }}
            {...props}
        >
            <Row gap={12} justifyContent="space-between">
                {children}
            </Row>
        </GhostContainer>
    );
};
