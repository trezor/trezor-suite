import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Switch, Icon, colors } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import MenuItem from '@suite-components/DeviceMenu/components/MenuItem';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import l10nCommonMessages from '@suite-views/index.messages';
import { setHideBalance } from '@wallet-actions/settingsActions';
import { AppState, Dispatch, AcquiredDevice } from '@suite-types';
import l10nMessages from './index.messages';

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${colors.DIVIDER};
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

const SwitchWrapper = styled.div``;

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setHideBalance: bindActionCreators(setHideBalance, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
    requestDeviceInstance: bindActionCreators(suiteActions.requestDeviceInstance, dispatch),
});

type Props = {} & ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

// Additional items:
// Add hidden wallet
// Hide balance switch
// Wallet Settings
// TODO: instead of passing this huge component each item could be an object with props like label, icon, actions, onClickHandler.
// and each item will be styled the same way.
const MenuItems = (props: Props) => {
    const showClone =
        props.device &&
        props.device.features &&
        props.device.features.passphrase_protection &&
        props.device.connected &&
        props.device.available;

    return (
        <>
            {showClone && (
                <MenuItem
                    onClick={() => props.requestDeviceInstance(props.device as AcquiredDevice)}
                >
                    <IconWrapper>
                        <Icon icon="WALLET_HIDDEN" size={14} color={colors.TEXT_SECONDARY} />
                    </IconWrapper>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_ADD_HIDDEN_WALLET} />
                    </Label>
                </MenuItem>
            )}
            <Divider />
            <MenuItem>
                <IconWrapper>
                    <Icon icon="EYE_CROSSED" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_HIDE_BALANCE} />
                </Label>
                <SwitchWrapper
                    onClick={event => {
                        // prevents closing the device menu when toggling the switch
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                >
                    <Switch
                        width={36}
                        height={18}
                        handleDiameter={14}
                        checkedIcon={false}
                        uncheckedIcon={false}
                        onChange={checked => {
                            props.setHideBalance(checked);
                        }}
                        checked={props.settings.hideBalance}
                    />
                </SwitchWrapper>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => props.goto('wallet-settings')}>
                <IconWrapper>
                    <Icon icon="COG" size={14} color={colors.TEXT_SECONDARY} />
                </IconWrapper>
                <Label>
                    <FormattedMessage {...l10nCommonMessages.TR_APPLICATION_SETTINGS} />
                </Label>
            </MenuItem>
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(MenuItems);
