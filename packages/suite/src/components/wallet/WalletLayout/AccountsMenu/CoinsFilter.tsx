import styled from 'styled-components';

import { CoinLogo, Tooltip } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector, useAccountSearch } from 'src/hooks/suite';
import { spacingsPx } from '@trezor/theme';

const StyledCoinLogo = styled(CoinLogo)<{ isSelected?: boolean }>`
    display: block;
    ${({ isSelected }) => !isSelected && `filter: grayscale(100%);`}
`;
const Container = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.xs} ${spacingsPx.xs} ${spacingsPx.xs} 48px;
    z-index: 2;
    position: relative;

    :hover {
        ${StyledCoinLogo} {
            filter: none;
        }
    }
`;

const OuterCircle = styled.div<{ isSelected?: boolean }>`
    height: 19px;
    width: 19px;
    border-radius: 50%;
    border: 2px solid
        ${({ isSelected, theme }) =>
            isSelected ? theme.backgroundSecondaryPressed : 'transparent'};
    transition: all 0.3;
    cursor: pointer;

    :hover {
        border: 2px solid ${({ theme }) => theme.backgroundSecondaryDefault};
    }
`;

export const CoinsFilter = () => {
    const { coinFilter, setCoinFilter } = useAccountSearch();
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const device = useSelector(selectDevice);

    const unavailableCapabilities = device?.unavailableCapabilities ?? {};
    const supportedNetworks = enabledNetworks.filter(symbol => !unavailableCapabilities[symbol]);

    const showCoinFilter = supportedNetworks.length > 1;

    if (!showCoinFilter) {
        return null;
    }

    return (
        <Container
            onClick={() => {
                setCoinFilter(undefined);
            }}
        >
            {supportedNetworks.map(n => {
                const isSelected = coinFilter === n;
                return (
                    <OuterCircle
                        key={n}
                        isSelected={isSelected}
                        onClick={e => {
                            e.stopPropagation();
                            // select the coin or deactivate if it's already selected
                            setCoinFilter(coinFilter === n ? undefined : n);
                        }}
                    >
                        <Tooltip content={n.toUpperCase()} cursor="pointer" delay={500}>
                            <StyledCoinLogo
                                data-test={`@account-menu/filter/${n}`}
                                symbol={n}
                                size={16}
                                data-test-activated={coinFilter === n}
                                isSelected={isSelected}
                            />
                        </Tooltip>
                    </OuterCircle>
                );
            })}
        </Container>
    );
};
