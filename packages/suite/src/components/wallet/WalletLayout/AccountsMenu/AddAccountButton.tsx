import { Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { useDiscovery, useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';

import { Tooltip, ButtonProps, IconButton, Button } from '@trezor/components';
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
    isFullWidth?: boolean;
}

export const AddAccountButton = ({
    device,
    isDisabled,
    closeMenu,
    isFullWidth,
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

    const handleOnClick = () => {
        if (!device) {
            return;
        }

        dispatch(
            openModal({
                type: 'add-account',
                device,
            }),
        );
        if (closeMenu) closeMenu();
    };

    const ButtonComponent = isFullWidth ? (
        <Button
            onClick={device ? handleOnClick : undefined}
            icon="PLUS"
            isDisabled={addAccountDisabled || isDisabled}
            size="small"
            variant="tertiary"
            isFullWidth
            {...rest}
        >
            <Translation id="TR_SIDEBAR_ADD_COIN" />
        </Button>
    ) : (
        <IconButton
            onClick={device ? handleOnClick : undefined}
            icon="PLUS"
            isDisabled={addAccountDisabled || isDisabled}
            size="small"
            variant="tertiary"
            {...rest}
            label={!tooltipMessage && <Translation id="TR_ADD_ACCOUNT" />}
        />
    );

    if (tooltipMessage) {
        return (
            <Tooltip
                isFullWidth={isFullWidth}
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
