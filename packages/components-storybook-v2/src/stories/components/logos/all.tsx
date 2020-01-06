import React from 'react';
import styled from 'styled-components';
import { CoinLogo, TrezorLogo, variables, colors, types } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Col = styled.div`
    margin: 1rem 0 3rem;
`;

const Row = styled.div`
    margin: 1rem 0 3rem;
    display: flex;
    align-items: center;
`;

const Heading = styled.h2``;

const IconWrapper = styled.div`
    display: inline-block;
    margin: 2rem 0 0 0;
    text-align: center;
    width: 20%;
`;

const LogoWrapper = styled.div`
    display: inline-block;
    margin: 2rem 1rem 0;
    padding: 1rem;
    text-align: center;
    justify-content: flex-start;
`;

const LogoWrapperDark = styled(LogoWrapper)`
    background: ${colors.BLACK17};
`;

const CoinName = styled.div`
    margin-bottom: 0.5rem;
    color: ${colors.BLACK50};
`;

const LogoName = styled.div`
    margin-bottom: 1rem;
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
                            <CoinLogo symbol={coin} data-test={`coin-${coin}`} size={64} />
                        </IconWrapper>
                    ))}
                </Col>
                <Heading>Trezor black</Heading>
                <Row>
                    <LogoWrapper>
                        <LogoName>Horizontal</LogoName>
                        <TrezorLogo
                            type="horizontal"
                            variant="black"
                            width="200px"
                            data-test="trezor-logo-horizontal-black"
                        />
                    </LogoWrapper>
                    <LogoWrapper>
                        <LogoName>Vertical</LogoName>
                        <TrezorLogo
                            type="vertical"
                            variant="black"
                            width="120px"
                            data-test="trezor-logo-vertical-black"
                        />
                    </LogoWrapper>
                    <LogoWrapper>
                        <LogoName>Symbol</LogoName>
                        <TrezorLogo
                            type="symbol"
                            variant="black"
                            width="50px"
                            data-test="trezor-logo-symbol-black"
                        />
                    </LogoWrapper>
                </Row>
                <Heading>Trezor white</Heading>
                <Row>
                    <LogoWrapperDark>
                        <LogoName>Horizontal</LogoName>
                        <TrezorLogo
                            type="horizontal"
                            variant="white"
                            width="200px"
                            data-test="trezor-logo-horizontal-white"
                        />
                    </LogoWrapperDark>
                    <LogoWrapperDark>
                        <LogoName>Vertical</LogoName>
                        <TrezorLogo
                            type="vertical"
                            variant="white"
                            width="120px"
                            data-test="trezor-logo-vertical-white"
                        />
                    </LogoWrapperDark>
                    <LogoWrapperDark>
                        <LogoName>Symbol</LogoName>
                        <TrezorLogo
                            type="symbol"
                            variant="white"
                            width="50px"
                            data-test="trezor-logo-symbol-white"
                        />
                    </LogoWrapperDark>
                </Row>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
