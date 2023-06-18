import React from 'react';
import styled, { css } from 'styled-components';
import { Button, Image, ImageProps } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useSelector, useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { Modal } from '../Modal';

const StyledImage = styled(Image)`
    flex: 1;
    margin: 20px 0;

    ${props =>
        'image' in props &&
        props.image === 'UNI_WARNING' &&
        css`
            max-height: 160px;
            flex: 0 0 auto;
        `}
`;

const StyledModal = styled(Modal)`
    width: 600px;
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

type Props = {
    title: React.ReactNode;
    text?: React.ReactNode;
    image?: Extract<ImageProps, { image: any }>['image'];
    allowSwitchDevice?: boolean;
    resolveButton?: React.ReactNode;
    ['data-test']?: string;
};

const DeviceInvalidModeLayout = (props: Props) => {
    const { title, text, image = 'UNI_WARNING', allowSwitchDevice, resolveButton } = props;

    const devices = useSelector(state => state.devices);
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <StyledModal
            heading={title}
            description={text}
            data-test={props['data-test']}
            bottomBar={
                <>
                    {resolveButton && resolveButton}
                    {allowSwitchDevice && devices.length > 1 && (
                        <Button
                            onClick={() =>
                                goto('suite-switch-device', { params: { cancelable: true } })
                            }
                        >
                            <Translation id="TR_SWITCH_DEVICE" />
                        </Button>
                    )}
                </>
            }
        >
            <StyledImage image={image} />
        </StyledModal>
    );
};

export default DeviceInvalidModeLayout;
