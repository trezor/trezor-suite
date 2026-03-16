import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Button, Icon, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';

import { useDiscovery, useDispatch } from 'src/hooks/suite';
import { type TrezorDevice } from 'src/types/suite';

const getExplanationMessage = (device: TrezorDevice | undefined, discoveryIsRunning: boolean) => {
    if (device && !device.connected) {
        return <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />;
    } else if (discoveryIsRunning) {
        return <Translation id="TR_TO_ADD_NEW_ACCOUNT_WAIT_FOR_DISCOVERY" />;
    }
};

type AddAccountButtonProps = {
    device: TrezorDevice | undefined;
    isIconOnly?: boolean;
};

export const AddAccountButton = ({ device, isIconOnly }: AddAccountButtonProps) => {
    const { isDiscoveryRunning } = useDiscovery();
    const dispatch = useDispatch();

    // TODO: add more cases when adding account is not possible
    const addAccountDisabled = isDiscoveryRunning || !device || !device.connected;
    const tooltipMessage = getExplanationMessage(device, isDiscoveryRunning);
    const dataTestId = '@account-menu/add-account';

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
    };

    const ButtonComponent = isIconOnly ? (
        <Tooltip isActive={!tooltipMessage} content={<Translation id="TR_ADD_ACCOUNT" />}>
            <Icon
                onClick={device ? handleOnClick : undefined}
                name="plus"
                size={16}
                {...(addAccountDisabled
                    ? { isDisabled: true }
                    : { intent: 'neutral', priority: 'secondary' })}
                data-testid={dataTestId}
            />
        </Tooltip>
    ) : (
        <Button
            onClick={device ? handleOnClick : undefined}
            iconLeft="plus"
            isDisabled={addAccountDisabled}
            intent="neutral"
            priority="secondary"
            width="100%"
            data-testid={dataTestId}
        >
            <Translation id="TR_ADD_ACCOUNT" />
        </Button>
    );

    return (
        <Tooltip
            isActive={!!tooltipMessage}
            tooltipMaxWidth={200}
            content={tooltipMessage}
            placement="bottom"
            cursor="not-allowed"
            delayShow={TOOLTIP_DELAY_NORMAL}
        >
            {ButtonComponent}
        </Tooltip>
    );
};
