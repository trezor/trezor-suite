import styled from 'styled-components';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';

import { TOOLTIP_DELAY_NORMAL, Tooltip, motionEasing } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacingsPx } from '@trezor/theme';
import { getNetwork } from '@suite-common/wallet-config';

import { useSelector, useAccountSearch } from 'src/hooks/suite';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledCoinLogo = styled(CoinLogo)<{ $isSelected?: boolean }>`
    display: block;
    border-radius: ${borders.radii.full};
    outline: 2px solid
        ${({ $isSelected, theme }) =>
            $isSelected ? theme.backgroundSecondaryPressed : 'transparent'};
    transition: outline 0.2s;
    filter: ${({ $isSelected }) => !$isSelected && 'grayscale(100%)'};
    cursor: pointer;

    &:hover {
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

    &:hover {
        ${StyledCoinLogo} {
            filter: none;
        }
    }
`;

export const CoinsFilter = () => {
    const { coinFilter, setCoinFilter } = useAccountSearch();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const supportedNetworkSymbols = [...supportedMainnets, ...supportedTestnets].map(
        network => network.symbol,
    );

    const availableNetworksSymbols = enabledNetworks.filter(networkSymbol =>
        supportedNetworkSymbols.includes(networkSymbol),
    );

    const showCoinFilter = availableNetworksSymbols.length > 1;

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
                {availableNetworksSymbols.map(networkSymbol => {
                    const isSelected = coinFilter === networkSymbol;

                    return (
                        <Tooltip
                            key={networkSymbol}
                            content={getNetwork(networkSymbol).name}
                            cursor="pointer"
                            delayShow={TOOLTIP_DELAY_NORMAL}
                        >
                            <motion.div key={networkSymbol} {...coinAnimcationConfig} layout>
                                <StyledCoinLogo
                                    data-testid={`@account-menu/filter/${networkSymbol}`}
                                    symbol={networkSymbol}
                                    size={16}
                                    data-test-activated={coinFilter === networkSymbol}
                                    $isSelected={isSelected}
                                    onClick={e => {
                                        e.stopPropagation();
                                        // select the coin or deactivate if it's already selected
                                        setCoinFilter(
                                            coinFilter === networkSymbol
                                                ? undefined
                                                : networkSymbol,
                                        );
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
