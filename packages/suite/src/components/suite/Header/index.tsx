import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import DeviceMenu from '@suite-components/DeviceMenu';

const Wrapper = styled.div`
    display: flex;
    padding-right: 15px;
    border-bottom: 1px solid ${colors.BODY};
    border-radius: 4px 4px 0px 0px;
    align-items: center;
    box-sizing: border-box;
    justify-content: space-between;
    width: 100%;
    background: ${colors.WHITE};
    max-width: 1170px;
    flex-direction: row;
`;

const Left = styled.div``;

const Header = ({ ...props }) => (
    <Wrapper {...props}>
        <Left>
            <DeviceMenu data-test="@suite/device_selection" />
        </Left>
    </Wrapper>
);

export default Header;
