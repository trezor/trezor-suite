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

export default {
    title: 'Assets/TrezorLogos',
} as Meta;

export const All: StoryObj = {
    render: () => (
        <StoryColumn minWidth={400}>
            <LogoWrapper>
                <TrezorLogo
                    type="horizontal"
                    width="200px"
                    data-test-id="trezor-logo-horizontal-black"
                />
                <TrezorLogo
                    type="vertical"
                    width="120px"
                    data-test-id="trezor-logo-vertical-black"
                />
                <TrezorLogo type="symbol" width="50px" data-test-id="trezor-logo-symbol-black" />
                <TrezorLogo type="suite" width="200px" data-test-id="trezor-suite-logo-black" />
                <TrezorLogo
                    type="suite_square"
                    width="50px"
                    data-test-id="trezor-suite-square-logo-white"
                />
                <TrezorLogo
                    type="suite_compact"
                    width="200px"
                    data-test-id="trezor-suite-compact-logo-white"
                />
            </LogoWrapper>
        </StoryColumn>
    ),
};
