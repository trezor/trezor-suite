import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { useDiscovery, useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';

import { Button, Tooltip, ButtonProps } from '@trezor/components';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

const StyledButton = styled(Button)`
    path {
        fill: ${({ theme, isDisabled }) =>
            isDisabled ? theme.TYPE_LIGHT_GREY : theme.TYPE_SECONDARY_TEXT};
    }
`;

const getExplanationMessage = (device: TrezorDevice | undefined, discoveryIsRunning: boolean) => {
    let message;
    if (device && !device.connected) {
        message = <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />;
    } else if (discoveryIsRunning) {
        message = <Translation id="TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY" />;
    }
    return message;
};

interface AddAccountButtonProps extends Omit<ButtonProps, 'children'> {
    device: TrezorDevice | undefined;
    noButtonLabel?: boolean;
    closeMenu?: () => void;
    isDisabled?: boolean;
}

export const AddAccountButton = ({
    device,
    isDisabled,
    noButtonLabel,
    closeMenu,
    ...rest
}: AddAccountButtonProps) => {
    const { discovery } = useDiscovery();
    const dispatch = useDispatch();

    const discoveryIsRunning = discovery ? discovery.status <= DiscoveryStatus.STOPPING : false;

    // TODO: add more cases when adding account is not possible
    const addAccountDisabled =
        discoveryIsRunning ||
        !device ||
        !device.connected ||
        device.authConfirm ||
        device.authFailed;

    const tooltipMessage = getExplanationMessage(device, discoveryIsRunning);

    const ButtonComponent = (
        <StyledButton
            onClick={
                device
                    ? () => {
                          dispatch(
                              openModal({
                                  type: 'add-account',
                                  device,
                              }),
                          );
                          if (closeMenu) closeMenu();
                      }
                    : undefined
            }
            icon="PLUS"
            variant="secondary"
            isDisabled={addAccountDisabled || isDisabled}
            {...rest}
        >
            {!noButtonLabel && <Translation id="TR_ADD_ACCOUNT" />}
        </StyledButton>
    );

    if (tooltipMessage) {
        return (
            <Tooltip maxWidth={200} content={tooltipMessage} placement="bottom">
                {ButtonComponent}
            </Tooltip>
        );
    }
    return ButtonComponent;
};
