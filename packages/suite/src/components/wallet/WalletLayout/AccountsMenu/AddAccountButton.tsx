import { Button, ButtonProps, TOOLTIP_DELAY_NORMAL, TextButton, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDiscovery, useDispatch } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';

import { useIsSidebarCollapsed } from '../../../suite/layouts/SuiteLayout/Sidebar/utils';

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
    const { isDiscoveryRunning } = useDiscovery();
    const dispatch = useDispatch();
    const isSidebarCollapsed = useIsSidebarCollapsed();
    // TODO: add more cases when adding account is not possible
    const addAccountDisabled =
        isDiscoveryRunning || !device || !device.connected || device.authFailed;

    const tooltipMessage = getExplanationMessage(device, isDiscoveryRunning);

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
            icon="plus"
            isDisabled={addAccountDisabled || isDisabled}
            size="small"
            variant="tertiary"
            isFullWidth
            {...rest}
        >
            <Translation id="TR_ADD_ACCOUNT" />
        </Button>
    ) : (
        <Tooltip isActive={!tooltipMessage} content={<Translation id="TR_ADD_ACCOUNT" />}>
            <TextButton
                onClick={device ? handleOnClick : undefined}
                icon="plus"
                isDisabled={addAccountDisabled || isDisabled}
                size="small"
                variant="tertiary"
                margin={{ right: isSidebarCollapsed ? 0 : spacings.xs }}
                {...rest}
            />
        </Tooltip>
    );

    if (tooltipMessage) {
        return (
            <Tooltip
                isFullWidth={isFullWidth}
                maxWidth={200}
                content={tooltipMessage}
                placement="bottom"
                cursor="not-allowed"
                delayShow={TOOLTIP_DELAY_NORMAL}
            >
                {ButtonComponent}
            </Tooltip>
        );
    }

    return ButtonComponent;
};
