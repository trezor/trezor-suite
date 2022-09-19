import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { P, CollapsibleBox, motionAnimation } from '@trezor/components';

import { CoinsList, Translation, TooltipSymbol } from '@suite-components';
import { Network } from '@wallet-types';

import { MoreCoins } from './MoreCoins';

const StyledCollapsibleBox = styled(CollapsibleBox)`
    margin-bottom: 0;
`;

const TestnetCoinsWrapper = styled(motion.div).attrs(() => ({ ...motionAnimation.expand }))`
    display: flex;
    flex-direction: column;
    margin-bottom: -18px;
`;

type EnableNetworkProps = {
    networks: Network[];
    testnetNetworks: Network[];
    selectedNetworks: Network['symbol'][];
    handleNetworkSelection: (symbol?: Network['symbol']) => void;
};

export const EnableNetwork = ({
    networks,
    testnetNetworks,
    selectedNetworks,
    handleNetworkSelection,
}: EnableNetworkProps) => {
    const hasTestnetNetworks = !!testnetNetworks?.length;

    return (
        <MoreCoins>
            <CoinsList
                onToggle={handleNetworkSelection}
                networks={networks}
                selectedNetworks={selectedNetworks}
            />

            {hasTestnetNetworks && (
                <StyledCollapsibleBox
                    variant="small"
                    heading={
                        <>
                            <P size="tiny" weight="bold">
                                <Translation id="TR_TESTNET_COINS" />
                            </P>
                            <TooltipSymbol
                                content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                            />
                        </>
                    }
                >
                    <TestnetCoinsWrapper>
                        <CoinsList
                            onToggle={handleNetworkSelection}
                            networks={testnetNetworks}
                            selectedNetworks={selectedNetworks}
                        />
                    </TestnetCoinsWrapper>
                </StyledCollapsibleBox>
            )}
        </MoreCoins>
    );
};
