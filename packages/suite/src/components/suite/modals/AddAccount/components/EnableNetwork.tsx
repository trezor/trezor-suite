import React, { useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, P, useTheme } from '@trezor/components';

import { CoinsList, Translation } from '@suite-components';
import { Network } from '@wallet-types';
import { ANIMATION } from '@suite-config';
import { MoreCoins } from './MoreCoins';

const TestnetCoinsTrigger = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    padding-top: 14px;
    padding-bottom: 14px;
    margin-bottom: -14px;
    cursor: pointer;
`;

const Label = styled(
    ({ isTestnetVisible, ...rest }: { isTestnetVisible: boolean; children: React.ReactNode }) => (
        <P size="tiny" weight="bold" {...rest} />
    ),
)`
    color: ${({ isTestnetVisible, theme }) =>
        isTestnetVisible ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY};
`;

const TestnetCoinsWrapper = styled(motion.div).attrs(() => ({ ...ANIMATION.EXPAND }))`
    display: flex;
    flex-direction: column;
`;

const TestnetCoinsDescription = styled(P).attrs(() => ({ size: 'small' }))`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-top: 7px;
    padding-bottom: 14px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const StyledIcon = styled(Icon)`
    padding-right: 4px;
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
    const theme = useTheme();
    const [isTestnetVisible, setTestnetVisible] = useState(false);
    const hasTestnetNetworks = !!testnetNetworks?.length;

    return (
        <MoreCoins>
            <CoinsList
                onToggle={handleNetworkSelection}
                networks={networks}
                selectedNetworks={selectedNetworks}
            />
            {hasTestnetNetworks && (
                <>
                    <TestnetCoinsTrigger
                        onClick={() => {
                            setTestnetVisible(!isTestnetVisible);
                        }}
                    >
                        <Label isTestnetVisible={isTestnetVisible}>
                            <Translation id="TR_TESTNET_COINS" />
                        </Label>
                        <Icon
                            canAnimate
                            isActive={isTestnetVisible}
                            size={16}
                            color={theme.TYPE_LIGHT_GREY}
                            icon="ARROW_DOWN"
                        />
                    </TestnetCoinsTrigger>
                    <AnimatePresence>
                        {isTestnetVisible && (
                            <TestnetCoinsWrapper>
                                <TestnetCoinsDescription>
                                    <StyledIcon
                                        size={12}
                                        color={theme.TYPE_LIGHT_GREY}
                                        icon="INFO"
                                    />
                                    <Translation id="TR_TESTNET_COINS_DESCRIPTION" />
                                </TestnetCoinsDescription>
                                <CoinsList
                                    onToggle={handleNetworkSelection}
                                    networks={testnetNetworks}
                                    selectedNetworks={selectedNetworks}
                                />
                            </TestnetCoinsWrapper>
                        )}
                    </AnimatePresence>
                </>
            )}
        </MoreCoins>
    );
};
