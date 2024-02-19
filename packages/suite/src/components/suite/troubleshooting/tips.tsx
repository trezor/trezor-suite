import { isWeb, isLinux, isAndroid } from '@trezor/env-utils';

import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { typography } from '@trezor/theme';
import styled from 'styled-components';

const Wrapper = styled.div`
    a {
        ${typography.hint};
    }
`;

// TODO: move it to separated components?

const UdevDescription = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('suite-udev'));

    return (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_UDEV_INSTALL_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink
                            variant="underline"
                            onClick={handleClick}
                            data-test-id="@goto/udev"
                        >
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};

const BridgeStatus = () => (
    <Wrapper>
        <Translation
            id="TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_DESCRIPTION"
            values={{
                a: chunks => (
                    <TrezorLink variant="underline" href="http://127.0.0.1:21325/status/">
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    </Wrapper>
);

const BridgeInstall = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('suite-bridge'));

    return (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_BRIDGE_INSTALL_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink variant="underline" onClick={handleClick}>
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};

const BridgeUse = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('suite-bridge'));

    return (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_BRIDGE_USE_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink variant="underline" onClick={handleClick}>
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};

export const TROUBLESHOOTING_TIP_BRIDGE_STATUS = {
    key: 'bridge-status',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_TITLE" />,
    description: <BridgeStatus />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_BRIDGE_INSTALL = {
    key: 'bridge-install',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BRIDGE_INSTALL_TITLE" />,
    description: <BridgeInstall />,
    hide: !isWeb(),
};

export const TROUBLESHOOTING_TIP_BRIDGE_USE = {
    key: 'bridge-use',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_BRIDGE_USE_TITLE" />,
    description: <BridgeUse />,
    hide: !isWeb() || isAndroid(),
};

export const TROUBLESHOOTING_TIP_CABLE = {
    key: 'cable',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_CABLE_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_USB = {
    key: 'usbPort',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_USB_PORT_DESCRIPTION" />,
    hide: isAndroid(),
};

export const TROUBLESHOOTING_TIP_DIFFERENT_COMPUTER = {
    key: 'differentComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_COMPUTER_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_RESTART_COMPUTER = {
    key: 'restartComputer',
    heading: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_TITLE" />,
    description: <Translation id="TR_TROUBLESHOOTING_TIP_RESTART_COMPUTER_DESCRIPTION" />,
};

export const TROUBLESHOOTING_TIP_UDEV = {
    key: 'udev',
    heading: <Translation id="TR_UDEV_DOWNLOAD_TITLE" />,
    description: <UdevDescription />,
    hide: !isLinux(),
};
