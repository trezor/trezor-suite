import React, { ReactNode, useRef } from 'react';

import { BlockchainState } from '@suite-common/wallet-core';
import {
    Box,
    Card,
    Column,
    DotIndicator,
    Note,
    Popover,
    PopoverRef,
    Row,
    Text,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import type { CustomBackend } from 'src/types/wallet';

const BackendRow = ({
    backend: { symbol, type },
    blockchain,
}: {
    backend: CustomBackend;
    blockchain: BlockchainState;
}) => {
    const dispatch = useDispatch();
    const chain = blockchain[symbol];

    return (
        <Box
            onClick={() => dispatch(openModal({ type: 'advanced-coin-settings', symbol }))}
            cursor="pointer"
            width={260}
        >
            <Row gap={spacings.sm}>
                <CoinLogo symbol={symbol} />
                <Column flex="1">
                    <Text typographyStyle="hint" ellipsisLineCount={1}>
                        {chain?.url ?? <Translation id="TR_BACKEND_DISCONNECTED" />}
                    </Text>
                    <Text typographyStyle="label" variant="tertiary" case="capitalize">
                        {type}
                    </Text>
                </Column>
                <DotIndicator isActive={chain?.connected} />
            </Row>
        </Box>
    );
};

type NavBackendsProps = {
    customBackends: CustomBackend[];
    children: ReactNode;
};

export const NavBackends = ({ customBackends, children }: NavBackendsProps) => {
    const popoverRef = useRef<PopoverRef>();
    const blockchain = useSelector(state => state.wallet.blockchain);

    return (
        <Popover
            ref={popoverRef}
            placement={{ position: 'top' }}
            content={
                <Card>
                    <Column gap={spacings.lg}>
                        <Column gap={spacings.sm}>
                            {customBackends.map(backend => (
                                <BackendRow
                                    key={backend.symbol}
                                    backend={backend}
                                    blockchain={blockchain}
                                />
                            ))}
                        </Column>
                        <Note>
                            <Translation id="TR_OTHER_COINS_USE_DEFAULT_BACKEND" />
                        </Note>
                    </Column>
                </Card>
            }
        >
            {children}
        </Popover>
    );
};
