import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { getNetwork } from '@suite-common/wallet-config';
import { TOOLTIP_DELAY_NORMAL, Tooltip, motionEasing } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';

import { useAccountSearch } from 'src/hooks/suite';

import { useAvailableNetworkSymbols } from './useAvailableNetworkSymbols';

const CoinLogoWrapper = styled.div<{ $isSelected?: boolean }>`
    display: block;
    border-radius: 4px;
    opacity: ${({ $isSelected }) => ($isSelected ? 1 : 0.5)};
    transition: outline 0.2s;
    filter: ${({ $isSelected }) => !$isSelected && 'grayscale(100%)'};
    cursor: pointer;

    &:hover {
        opacity: ${({ $isSelected }) => ($isSelected ? 1 : 0.7)};
    }
`;

const Container = styled.div`
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin: 4px 8px 8px 48px;
    z-index: 2;

    &[data-empty-filter='true'] ${CoinLogoWrapper} {
        opacity: 1;
        filter: none;
    }

    &:hover ${CoinLogoWrapper} {
        filter: none;
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

    const isFilterEmpty = coinFilter.length === 0;

    return (
        <Container
            data-empty-filter={isFilterEmpty}
            onClick={() => {
                setCoinFilter([]);
            }}
        >
            <AnimatePresence initial={false}>
                {availableNetworksSymbols.map(networkSymbol => {
                    const isSelected = coinFilter.includes(networkSymbol);

                    return (
                        <Tooltip
                            key={networkSymbol}
                            content={getNetwork(networkSymbol).name}
                            cursor="pointer"
                            delayShow={TOOLTIP_DELAY_NORMAL}
                        >
                            <motion.div key={networkSymbol} {...coinAnimcationConfig} layout>
                                <CoinLogoWrapper
                                    data-test-activated={isSelected}
                                    $isSelected={isSelected}
                                    onClick={e => {
                                        e.stopPropagation();
                                        toggleCoinFilter(networkSymbol);
                                    }}
                                >
                                    <NetworkIcon
                                        data-testid={`@account-menu/filter/${networkSymbol}`}
                                        networkSymbol={networkSymbol}
                                        size={16}
                                    />
                                </CoinLogoWrapper>
                            </motion.div>
                        </Tooltip>
                    );
                })}
            </AnimatePresence>
        </Container>
    );
};
