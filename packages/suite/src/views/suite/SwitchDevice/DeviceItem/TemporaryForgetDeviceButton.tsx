import type { AcquiredDevice, TrezorDevice } from '@suite-common/suite-types';
import { deviceActions, forgetSingleDevicePersistentDataThunk } from '@suite-common/wallet-core';
import { IconButton, Paragraph, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

type TemporaryForgetDeviceButtonProps = {
    device: TrezorDevice;
    instances: AcquiredDevice[];
};

// TODO this UI is only temporary https://github.com/trezor/trezor-suite/issues/21294
export const TemporaryForgetDeviceButton = ({
    device,
    instances,
}: TemporaryForgetDeviceButtonProps) => {
    const dispatch = useDispatch();

    // TODO remove debug check when feature is complete
    const isDebug = useSelector(selectIsDebugModeActive);
    if (!isDebug) return null;

    const handleClick = () => {
        dispatch(forgetSingleDevicePersistentDataThunk({ device }));

        instances.forEach(instance => {
            dispatch(deviceActions.forgetDevice({ device: instance }));
        });

        analytics.report({
            type: EventType.SwitchDeviceForget,
        });
    };

    return (
        <Tooltip
            content={
                <div>
                    <Paragraph typographyStyle="highlight" textWrap="balance">
                        <Translation id="TR_FORGET_DEVICE_HEADING" />
                    </Paragraph>
                    <Paragraph>
                        <Translation id="TR_FORGET_DEVICE_DESCRIPTION" />
                    </Paragraph>
                </div>
            }
        >
            <IconButton icon="linkBreak" variant="tertiary" size="small" onClick={handleClick} />
        </Tooltip>
    );
};
