import { AnimatePresence, MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { getNetwork } from '@suite-common/wallet-config';
import { TOOLTIP_DELAY_NORMAL, Tooltip, motionEasing } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacingsPx } from '@trezor/theme';

import { useAccountSearch } from 'src/hooks/suite';

import { useAvailableNetworkSymbols } from './useAvailableNetworkSymbols';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledCoinLogo = styled(CoinLogo)<{ $isSelected?: boolean; $coinFilter?: string }>`
    display: block;
    border-radius: ${borders.radii.xxs};
    opacity: ${({ $isSelected, $coinFilter }) =>
        $coinFilter === undefined || $isSelected ? 1 : 0.5};

    transition: outline 0.2s;
    filter: ${({ $isSelected }) => !$isSelected && 'grayscale(100%)'};
    cursor: pointer;

    &:hover {
        opacity: ${({ $isSelected, $coinFilter }) =>
            $coinFilter !== undefined && !$isSelected ? 0.7 : 1};
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
    const availableNetworksSymbols = useAvailableNetworkSymbols();

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
                                    type="network"
                                    size={16}
                                    data-test-activated={coinFilter === networkSymbol}
                                    $isSelected={isSelected}
                                    $coinFilter={coinFilter}
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
