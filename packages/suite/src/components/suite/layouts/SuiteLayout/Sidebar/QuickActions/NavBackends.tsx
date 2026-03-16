import React from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { type BlockchainState } from '@suite-common/wallet-core';
import { Box, Column, DotIndicator, Note, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

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
            <Row gap={12}>
                <CoinLogo symbol={symbol} />
                <Column flex="1" overflow="hidden">
                    <Text typographyStyle="body-sm" ellipsisLineCount={1}>
                        {chain?.url ?? <Translation id="TR_BACKEND_DISCONNECTED" />}
                    </Text>
                    <Text
                        typographyStyle="body-xs"
                        intent="neutral"
                        priority="secondary"
                        case="capitalize"
                    >
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
};

export const NavBackends = ({ customBackends }: NavBackendsProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain);

    return (
        <Column gap={16} padding={4}>
            <Column gap={12}>
                {customBackends.map(backend => (
                    <BackendRow key={backend.symbol} backend={backend} blockchain={blockchain} />
                ))}
            </Column>
            <Note>
                <Translation id="TR_OTHER_COINS_USE_DEFAULT_BACKEND" />
            </Note>
        </Column>
    );
};
