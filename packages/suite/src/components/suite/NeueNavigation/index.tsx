import React from 'react';
import DeviceSelector from './components/DeviceSelector';
import MainNavigation from './components/MainNavigation';
import NavigationActions from './components/NavigationActions';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const StyledDeviceSelector = styled(DeviceSelector)``;

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 80px;
    padding: 6px 32px 6px 8px;
    align-items: center;
    background: ${colors.NEUE_BG_WHITE};
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};

    &:hover ${StyledDeviceSelector} {
        /* apply same device selector's hover styles on hover anywhere in navigation panel */
        border-radius: 4px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    }
`;

interface Props {
    openSecondaryMenu?: () => void;
}

const NeueNavigation = (props: Props) => {
    return (
        <Wrapper>
            <StyledDeviceSelector />
            <MainNavigation openSecondaryMenu={props.openSecondaryMenu} />
            <NavigationActions openSecondaryMenu={props.openSecondaryMenu} />
        </Wrapper>
    );
};

export default NeueNavigation;
