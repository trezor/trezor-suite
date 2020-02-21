import React from 'react';
import styled from 'styled-components';
import { CoinLogo, TrezorLogo, variables, colors, types } from '@trezor/components';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../components/Story';

const CoinName = styled.div`
    margin-bottom: 0.5rem;
    color: ${colors.BLACK50};
`;

interface WrapperProps {
    isDark?: boolean;
}

const LogoWrapper = styled.div<WrapperProps>`
    background: ${props => (props.isDark ? 'black' : 'none')};
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const WrapperIcons = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const Icon = styled.div`
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
const Wrapper = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

storiesOf('Logos', module).add(
    'All',
    () => {
        return (
            <>
                <StoryColumn minWidth={700}>
                    <WrapperIcons>
                        {variables.COINS.map((coin: types.CoinType) => (
                            <Icon>
                                <CoinName>{coin}</CoinName>
                                <CoinLogo symbol={coin} data-test={`coin-${coin}`} size={64} />
                            </Icon>
                        ))}
                    </WrapperIcons>
                </StoryColumn>
                <StoryColumn minWidth={400}>
                    <LogoWrapper>
                        <TrezorLogo
                            type="horizontal"
                            variant="black"
                            width="200px"
                            data-test="trezor-logo-horizontal-black"
                        />
                        <TrezorLogo
                            type="vertical"
                            variant="black"
                            width="120px"
                            data-test="trezor-logo-vertical-black"
                        />
                        <TrezorLogo
                            type="symbol"
                            variant="black"
                            width="50px"
                            data-test="trezor-logo-symbol-black"
                        />
                    </LogoWrapper>
                    <LogoWrapper isDark>
                        <TrezorLogo
                            type="horizontal"
                            variant="white"
                            width="200px"
                            data-test="trezor-logo-horizontal-white"
                        />
                        <TrezorLogo
                            type="vertical"
                            variant="white"
                            width="120px"
                            data-test="trezor-logo-vertical-white"
                        />
                        <TrezorLogo
                            type="symbol"
                            variant="white"
                            width="50px"
                            data-test="trezor-logo-symbol-white"
                        />
                    </LogoWrapper>
                </StoryColumn>
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
