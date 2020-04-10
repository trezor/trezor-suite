import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { Button, variables } from '@trezor/components';
import { Image as Img } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';

const { SCREEN_SIZE } = variables;
const Wrapper = styled.div`
    max-width: 80vw;
    @media (min-width: ${SCREEN_SIZE.SM}) {
        max-width: 60vw;
    }
    @media (min-width: ${SCREEN_SIZE.LG}) {
        max-width: 40vw;
    }
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.H2};
    margin-bottom: 4px;
`;

const Text = styled.div``;

const Image = styled(Img)`
    flex: 1;
    margin: 20px 0;
`;

const Buttons = styled.div`
    display: flex;
    justify-content: space-around;
`;

const StyledButton = styled(Button)`
    // margin: 20px;
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

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
});

type Props = {
    title: React.ReactNode;
    text?: React.ReactNode;
    image?: React.ComponentProps<typeof Img>['image'];
    allowSwitchDevice?: boolean;
    resolveButton?: React.ReactNode;
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
        <Wrapper>
            <Title>{title}</Title>
            {text && <Text>{text}</Text>}
            <Image image={image} />
            <Buttons>
                {resolveButton && resolveButton}
                {/* todo: filter only physical devices */}
                {allowSwitchDevice && devices.length > 1 && (
                    <StyledButton onClick={() => goto('suite-switch-device', { cancelable: true })}>
                        Switch device
                    </StyledButton>
                )}
            </Buttons>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(DeviceInvalidModeLayout);
