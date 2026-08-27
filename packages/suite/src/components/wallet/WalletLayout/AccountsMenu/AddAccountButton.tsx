import { useState } from 'react';

import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Box, Icon, Row, ShortcutBadge, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { PlusIcon } from '@trezor/icons';

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
};

export const AddAccountButton = ({ device }: AddAccountButtonProps) => {
    const { isDiscoveryRunning } = useDiscovery();
    const [isHovered, setIsHovered] = useState(false);

    const dispatch = useDispatch();

    // TODO: add more cases when adding account is not possible
    const addAccountDisabled = isDiscoveryRunning || !device?.connected;
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

    const ButtonComponent = (
        <Tooltip
            isActive={!tooltipMessage}
            content={
                <Row gap={12}>
                    <Translation id="TR_ADD_ACCOUNT" />
                    <ShortcutBadge shortcut={['ALT', 'KEY_A']} />
                </Row>
            }
        >
            <Box onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                <Icon
                    onClick={device ? handleOnClick : undefined}
                    as={PlusIcon}
                    size={16}
                    isDisabled={addAccountDisabled}
                    intent="neutral"
                    priority={isHovered ? 'primary' : 'secondary'}
                    data-testid={dataTestId}
                />
            </Box>
        </Tooltip>
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
