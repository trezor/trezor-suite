import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { Icon, colors } from '@trezor/components';
import DeviceIcon from '@suite-components/images/DeviceIcon';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nMessages from './index.messages';
import DeviceInstances from '../DeviceInstances';
import Item from '../MenuItem';

import { AcquiredDevice, Dispatch } from '@suite-types';

const Wrapper = styled.div`
    background: ${colors.WHITE};
`;

const Label = styled.div`
    flex: 1;
`;

const IconWrapper = styled.div`
    width: 18px;
    display: flex;
    justify-content: center;
    margin-right: 15px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    acquireDevice: bindActionCreators(suiteActions.acquireDevice, dispatch),
    selectDevice: bindActionCreators(suiteActions.selectDevice, dispatch),
    requestForgetDevice: bindActionCreators(suiteActions.requestForgetDevice, dispatch),
});

type Props = {
    device: AcquiredDevice;
    instances: AcquiredDevice[];
    additionalDeviceMenuItems: React.ReactNode;
} & ReturnType<typeof mapDispatchToProps>;

const MenuItems = ({
    device,
    instances,
    goto,
    acquireDevice,
    selectDevice,
    requestForgetDevice,
    additionalDeviceMenuItems,
}: Props) => {
    // const showDeviceMenu = device && device.mode === 'normal';

    const showRenewSession = device && device.status !== 'available';

    return (
        <Wrapper>
            <DeviceInstances
                instances={instances}
                selectDevice={selectDevice}
                requestForgetDevice={requestForgetDevice}
            />
            {showRenewSession && (
                <Item onClick={acquireDevice}>
                    <IconWrapper>
                        <DeviceIcon device={device} size={14} color={colors.TEXT_SECONDARY} />
                    </IconWrapper>
                    <Label>
                        <Translation>{l10nMessages.TR_RENEW_SESSION}</Translation>
                    </Label>
                </Item>
            )}
            {additionalDeviceMenuItems}
            <Item onClick={() => goto('suite-device-settings')}>
                <IconWrapper>
                    <Icon icon="COG" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <Translation>{l10nCommonMessages.TR_DEVICE_SETTINGS}</Translation>
                </Label>
            </Item>
            <Item onClick={() => requestForgetDevice(device)}>
                <IconWrapper>
                    <Icon icon="EJECT" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <Translation>{l10nCommonMessages.TR_FORGET_DEVICE}</Translation>
                </Label>
            </Item>
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(MenuItems);
