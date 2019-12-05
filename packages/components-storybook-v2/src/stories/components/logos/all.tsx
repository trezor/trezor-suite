import React from 'react';
import styled from 'styled-components';
import { CoinLogo, TrezorLogo, variables, colors, types } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Col = styled.div`
    margin: 1rem 0 2rem;
`;

const Heading = styled.h2``;

const IconWrapper = styled.div`
    display: inline-block;
    margin: 2rem 0 0 0;
    text-align: center;
    width: 20%;
`;

const ComponentWrapper = styled.div`
    display: inline-block;
    margin: 2rem 0 0 0;
    padding: 1rem;
    text-align: center;
`;

const ComponentWrapperDark = styled(ComponentWrapper)`
    background: ${colors.BLACK17};
`;

const CoinName = styled.div`
    margin-bottom: 0.5rem;
    color: ${colors.BLACK50};
`;

storiesOf('Logos', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Heading>Coins</Heading>
                <Col>
                    {variables.COINS.map((coin: types.CoinType) => (
                        <IconWrapper>
                            <CoinName>{coin}</CoinName>
                            <CoinLogo
                                symbol={coin}
                                data-test={`icon-${coin.toLowerCase().replace('_', '-')}`}
                            />
                        </IconWrapper>
                    ))}
                </Col>
                <Heading>Trezor logo black</Heading>
                <Col>
                    <ComponentWrapper>
                        <CoinName>Horizontal</CoinName>
                        <TrezorLogo type="horizontal" variant="black" width="200px" />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <CoinName>Vertical</CoinName>
                        <TrezorLogo type="vertical" variant="black" width="120px" />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <CoinName>Symbol</CoinName>
                        <TrezorLogo type="symbol" variant="black" width="50px" />
                    </ComponentWrapper>
                </Col>
                <Heading>Trezor logo white</Heading>
                <Col>
                    <ComponentWrapperDark>
                        <CoinName>Horizontal</CoinName>
                        <TrezorLogo type="horizontal" variant="white" width="200px" />
                    </ComponentWrapperDark>
                    <ComponentWrapperDark>
                        <CoinName>Vertical</CoinName>
                        <TrezorLogo type="vertical" variant="white" width="120px" />
                    </ComponentWrapperDark>
                    <ComponentWrapperDark>
                        <CoinName>Symbol</CoinName>
                        <TrezorLogo type="symbol" variant="white" width="50px" />
                    </ComponentWrapperDark>
                </Col>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
