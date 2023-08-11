import React from 'react';
import styled from 'styled-components';
import { CoinLogo, TrezorLogo, variables, types } from '../../index';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../support/Story';

const CoinName = styled.div`
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface WrapperProps {
    isDark?: boolean;
}

const LogoWrapper = styled.div<WrapperProps>`
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

storiesOf('Logos', module).add(
    'All',
    () => (
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
                        width="200px"
                        data-test="trezor-logo-horizontal-black"
                    />
                    <TrezorLogo
                        type="vertical"
                        width="120px"
                        data-test="trezor-logo-vertical-black"
                    />
                    <TrezorLogo type="symbol" width="50px" data-test="trezor-logo-symbol-black" />
                    <TrezorLogo type="suite" width="200px" data-test="trezor-suite-logo-black" />
                    <TrezorLogo
                        type="suite_square"
                        width="50px"
                        data-test="trezor-suite-square-logo-white"
                    />
                    <TrezorLogo
                        type="suite_compact"
                        width="200px"
                        data-test="trezor-suite-compact-logo-white"
                    />
                </LogoWrapper>
            </StoryColumn>
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    },
);
