import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { SPARK_NETWORK_SYMBOL } from '@suite-common/spark';
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

const StyledSparkFilter = styled.div<{ $isSelected?: boolean; $coinFilter?: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: ${borders.radii.xxs};
    background: ${({ theme, $isSelected }) =>
        $isSelected ? theme.legacyBackgroundPrimarySubtleOnElevation0 : theme.surfaceFillPage};
    color: ${({ theme, $isSelected }) =>
        $isSelected ? theme.contentPrimary : theme.contentSecondary};
    border: 1px solid ${({ theme }) => theme.legacyBorderElevation1};
    font-size: 10px;
    font-weight: 600;
    line-height: 12px;
    opacity: ${({ $isSelected, $coinFilter }) =>
        $coinFilter === undefined || $isSelected ? 1 : 0.5};
    cursor: pointer;
    user-select: none;

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
    const { coinFilter, setCoinFilter, toggleCoinFilter } = useAccountSearch();
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
                setCoinFilter([]);
            }}
        >
            <AnimatePresence initial={false}>
                {availableNetworksSymbols.map(networkSymbol => {
                    const isSelected = coinFilter.includes(networkSymbol);
                    const tooltipContent =
                        networkSymbol === SPARK_NETWORK_SYMBOL
                            ? 'Spark'
                            : getNetwork(networkSymbol).name;

                    return (
                        <Tooltip
                            key={networkSymbol}
                            content={tooltipContent}
                            cursor="pointer"
                            delayShow={TOOLTIP_DELAY_NORMAL}
                        >
                            <motion.div key={networkSymbol} {...coinAnimcationConfig} layout>
                                {networkSymbol === SPARK_NETWORK_SYMBOL ? (
                                    <StyledSparkFilter
                                        data-testid="@account-menu/filter/spark"
                                        data-test-activated={isSelected}
                                        $isSelected={isSelected || coinFilter.length === 0}
                                        $coinFilter={networkSymbol}
                                        onClick={e => {
                                            e.stopPropagation();
                                            toggleCoinFilter(networkSymbol);
                                        }}
                                    >
                                        S
                                    </StyledSparkFilter>
                                ) : (
                                    <StyledCoinLogo
                                        data-testid={`@account-menu/filter/${networkSymbol}`}
                                        symbol={networkSymbol}
                                        type="network"
                                        size={16}
                                        data-test-activated={isSelected}
                                        $isSelected={isSelected || coinFilter.length === 0}
                                        $coinFilter={networkSymbol}
                                        onClick={e => {
                                            e.stopPropagation();
                                            toggleCoinFilter(networkSymbol);
                                        }}
                                    />
                                )}
                            </motion.div>
                        </Tooltip>
                    );
                })}
            </AnimatePresence>
        </Container>
    );
};
