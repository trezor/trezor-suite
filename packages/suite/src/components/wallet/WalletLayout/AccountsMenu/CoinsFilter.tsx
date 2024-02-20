import styled from 'styled-components';

import { CoinLogo, TOOLTIP_DELAY_NORMAL, Tooltip, motionEasing } from '@trezor/components';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { borders, spacingsPx } from '@trezor/theme';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector, useAccountSearch } from 'src/hooks/suite';

const StyledCoinLogo = styled(CoinLogo)<{ isSelected?: boolean }>`
    display: block;
    border-radius: ${borders.radii.full};
    outline: 2px solid
        ${({ isSelected, theme }) =>
            isSelected ? theme.backgroundSecondaryPressed : 'transparent'};
    transition: outline 0.2s;
    filter: ${({ isSelected }) => !isSelected && 'grayscale(100%)'};
    cursor: pointer;

    :hover {
        outline: 2px solid ${({ theme }) => theme.backgroundSecondaryDefault};
    }
`;

const Container = styled.div`
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.xxs} ${spacingsPx.xs} ${spacingsPx.xs} 48px;
    z-index: 2;

    :hover {
        ${StyledCoinLogo} {
            filter: none;
        }
    }
`;

export const CoinsFilter = () => {
    const { coinFilter, setCoinFilter } = useAccountSearch();
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const device = useSelector(selectDevice);

    const unavailableCapabilities = device?.unavailableCapabilities ?? {};
    const supportedNetworks = enabledNetworks.filter(symbol => !unavailableCapabilities[symbol]);

    const showCoinFilter = supportedNetworks.length > 1;

    const coinAnimcationConfig: MotionProps = {
        initial: {
            opacity: 0,
        },
        animate: {
            opacity: 1,
        },
        exit: {
            opacity: 0,
        },
        transition: {
            ease: motionEasing.transition,
            layout: {
                ease: motionEasing.transition,
            },
        },
    };

    if (!showCoinFilter) {
        return null;
    }

    return (
        <Container
            onClick={() => {
                setCoinFilter(undefined);
            }}
        >
            <AnimatePresence initial={false}>
                {supportedNetworks.map(network => {
                    const isSelected = coinFilter === network;

                    return (
                        <Tooltip
                            key={network}
                            content={network.toUpperCase()}
                            cursor="pointer"
                            delayShow={TOOLTIP_DELAY_NORMAL}
                        >
                            <motion.div key={network} {...coinAnimcationConfig} layout>
                                <StyledCoinLogo
                                    data-test={`@account-menu/filter/${network}`}
                                    symbol={network}
                                    size={16}
                                    data-test-activated={coinFilter === network}
                                    isSelected={isSelected}
                                    onClick={e => {
                                        e.stopPropagation();
                                        // select the coin or deactivate if it's already selected
                                        setCoinFilter(coinFilter === network ? undefined : network);
                                    }}
                                />
                            </motion.div>
                        </Tooltip>
                    );
                })}
            </AnimatePresence>
        </Container>
    );
};
