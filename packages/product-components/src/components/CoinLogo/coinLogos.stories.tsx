import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { networksCollection } from '@suite-common/wallet-config';
import { StoryColumn } from '@trezor/components';

import { CoinLogo } from './CoinLogo';
import { COINS, isCoinSymbol } from '../../constants/coins';
import { NETWORK_ICONS, isNetworkSymbolWithIcon } from '../../constants/networks';

const Heading = styled.h2`
    margin-bottom: 2px;
`;

const SubHeading = styled.p``;

const CoinName = styled.div`
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.contentSecondary};
`;

const WrapperIcons = styled.div`
    display: grid;
    width: 100%;
    gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const Icon = styled.div`
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const meta: Meta<typeof CoinLogo> = {
    title: 'CoinLogo',
};
export default meta;

export const All: StoryObj = {
    render: () => (
        <>
            <StoryColumn minWidth={700}>
                <Heading>Token</Heading>
                <SubHeading>Network circle SVG icons</SubHeading>
                <WrapperIcons>
                    {Object.keys(COINS).map(coinSymbol => (
                        <Icon key={coinSymbol}>
                            <CoinName>{coinSymbol}</CoinName>
                            {isCoinSymbol(coinSymbol) && (
                                <CoinLogo
                                    symbol={coinSymbol}
                                    data-testid={`coin-${coinSymbol}`}
                                    size={64}
                                />
                            )}
                        </Icon>
                    ))}
                </WrapperIcons>
            </StoryColumn>
            <StoryColumn minWidth={700}>
                <Heading>Network</Heading>
                <SubHeading>Network squared SVG icons</SubHeading>
                <WrapperIcons>
                    {Object.keys(NETWORK_ICONS).map(network => (
                        <Icon key={network}>
                            <CoinName>{network}</CoinName>
                            {isNetworkSymbolWithIcon(network) && (
                                <CoinLogo
                                    symbol={network}
                                    data-testid={`network-${network}`}
                                    type="network"
                                    size={64}
                                />
                            )}
                        </Icon>
                    ))}
                </WrapperIcons>
            </StoryColumn>
            <StoryColumn minWidth={700}>
                <Heading>Token with network</Heading>
                <SubHeading>
                    Native token SVG icon with network SVG icon. Only applicable for L2 networks.
                </SubHeading>
                <WrapperIcons>
                    {networksCollection
                        .filter(network => network.settlementLayer)
                        .map(network => (
                            <Icon key={network.symbol}>
                                <CoinName>{network.symbol}</CoinName>
                                {isCoinSymbol(network.symbol) && (
                                    <CoinLogo
                                        symbol={network.symbol}
                                        data-testid={`l2-network-${network}`}
                                        type="tokenWithNetwork"
                                        size={64}
                                    />
                                )}
                            </Icon>
                        ))}
                </WrapperIcons>
            </StoryColumn>
        </>
    ),
};
