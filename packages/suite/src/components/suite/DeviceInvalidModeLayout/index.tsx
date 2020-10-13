import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled, { css } from 'styled-components';
import { Button, Modal } from '@trezor/components';
import { Image as Img, Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';

const Image = styled(Img)`
    flex: 1;
    margin: 20px 0;

    ${props =>
        props.image === 'UNI_WARNING' &&
        css`
            height: 64px;
            flex: 0 0 auto;
        `}
`;

const Buttons = styled.div`
    display: flex;
    justify-content: space-around;
`;

/**
 * DeviceInvalidMode is subset of ApplicationState, see Preloader component. It shows that device is not in state
 * application can work with and user must take one of the following actions:
 *
 *   1. trigger switch device menu (only available if multiple devices are connected)
 *   2. click resolve button which takes user to a view where he may resolve issue with current device
 *
 * This is a layout component which indicates that it is supposed to unify layout of all DeviceInvalidMode
 * like views listed in suite/views
 */

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
        },
        dispatch,
    );

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
});

type Props = {
    title: React.ReactNode;
    text?: React.ReactNode;
    image?: React.ComponentProps<typeof Img>['image'];
    allowSwitchDevice?: boolean;
    resolveButton?: React.ReactNode;
    ['data-test']?: string;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const DeviceInvalidModeLayout = (props: Props) => {
    const {
        title,
        text,
        image = 'UNI_WARNING',
        allowSwitchDevice,
        devices,
        resolveButton,
        goto,
    } = props;
    return (
        <Modal size="small" heading={title} description={text} data-test={props['data-test']}>
            <Image image={image} />
            <Buttons>
                {resolveButton && resolveButton}
                {allowSwitchDevice && devices.length > 1 && (
                    <Button onClick={() => goto('suite-switch-device', { cancelable: true })}>
                        <Translation id="TR_SWITCH_DEVICE" />
                    </Button>
                )}
            </Buttons>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(DeviceInvalidModeLayout);
