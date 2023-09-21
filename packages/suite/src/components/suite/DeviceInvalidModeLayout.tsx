import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { Button, Image, ImageType } from '@trezor/components';
import { selectDevicesCount } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

import { Modal } from './modals/Modal/Modal';

const StyledImage = styled(Image)<{ image: ImageType }>`
    flex: 1;
    margin: 20px 0;

    ${({ image }) =>
        image === 'UNI_WARNING' &&
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

type DeviceInvalidModeLayoutProps = {
    title: ReactNode;
    text?: ReactNode;
    image?: ImageType;
    allowSwitchDevice?: boolean;
    resolveButton?: ReactNode;
    ['data-test']?: string;
};

export const DeviceInvalidModeLayout = ({
    title,
    text,
    image = 'UNI_WARNING',
    allowSwitchDevice,
    resolveButton,
    'data-test': dataTest,
}: DeviceInvalidModeLayoutProps) => {
    const devicesCount = useSelector(selectDevicesCount);
    const dispatch = useDispatch();

    const handleSwitchDeviceButtonClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    return (
        <StyledModal
            heading={title}
            description={text}
            data-test={dataTest}
            bottomBarComponents={
                <>
                    {resolveButton && resolveButton}
                    {allowSwitchDevice && devicesCount > 1 && (
                        <Button onClick={handleSwitchDeviceButtonClick}>
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
