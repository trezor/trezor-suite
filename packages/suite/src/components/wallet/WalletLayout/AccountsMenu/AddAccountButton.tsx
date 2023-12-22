import { Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { useDiscovery, useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';

import { Tooltip, ButtonProps, IconButton } from '@trezor/components';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

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
    closeMenu?: () => void;
    isDisabled?: boolean;
}

export const AddAccountButton = ({
    device,
    isDisabled,
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
        <IconButton
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
            isDisabled={addAccountDisabled || isDisabled}
            size="small"
            variant="tertiary"
            {...rest}
        />
    );

    if (tooltipMessage) {
        return (
            <Tooltip
                maxWidth={200}
                content={tooltipMessage}
                placement="bottom"
                cursor="not-allowed"
            >
                {ButtonComponent}
            </Tooltip>
        );
    }
    return ButtonComponent;
};
