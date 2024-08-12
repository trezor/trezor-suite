import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { TrezorLogo } from '../../../index';
import { StoryColumn } from '../../../support/Story';

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

const meta: Meta = {
    title: 'Assets/TrezorLogos',
} as Meta;
export default meta;

export const All: StoryObj = {
    render: () => (
        <StoryColumn minWidth={400}>
            <LogoWrapper>
                <TrezorLogo
                    type="horizontal"
                    width="200px"
                    data-testid="trezor-logo-horizontal-black"
                />
                <TrezorLogo
                    type="vertical"
                    width="120px"
                    data-testid="trezor-logo-vertical-black"
                />
                <TrezorLogo type="symbol" width="50px" data-testid="trezor-logo-symbol-black" />
                <TrezorLogo type="suite" width="200px" data-testid="trezor-suite-logo-black" />
                <TrezorLogo
                    type="suite_square"
                    width="50px"
                    data-testid="trezor-suite-square-logo-white"
                />
                <TrezorLogo
                    type="suite_compact"
                    width="200px"
                    data-testid="trezor-suite-compact-logo-white"
                />
            </LogoWrapper>
        </StoryColumn>
    ),
};
