/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useDispatch, useSelector } from 'react-redux';

import { deviceActions } from '@suite-common/device';
import {
    type WithSuiteSyncAndDeviceState,
    isSuiteSyncSupportedByDevice,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
    setSuiteSyncOwner,
} from '@suite-common/suite-sync';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Code, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

type SuiteSyncWalletDebugProps = {
    device: AcquiredDevice;
    /** @deprecated this prop is a hack so we do not depend on Legacy Metadata Labeling */
    isLegacyLabelingEnabled: boolean;
};

export const SuiteSyncWalletDebug = ({
    device,
    isLegacyLabelingEnabled,
}: SuiteSyncWalletDebugProps) => {
    const dispatch = useDispatch();

    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const deviceStaticSessionId = device.state?.staticSessionId;
    const suiteSyncOwner = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectSuiteSyncOwnerForDeviceStaticId(state, deviceStaticSessionId),
    );

    const isSuiteSyncDebug =
        isSuiteSyncDebugEnabled &&
        isSuiteSyncSupportedByDevice(device) &&
        deviceStaticSessionId !== undefined;

    if (!isSuiteSyncDebug) {
        return;
    }

    const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(deviceStaticSessionId);

    const handleResetKeysRequest = () => {
        if (!device?.id || device.state?.staticSessionId === undefined) {
            return;
        }

        dispatch(
            setSuiteSyncOwner({
                deviceStaticId: device.state.staticSessionId,
                owner: null,
            }),
        );
        dispatch(
            deviceActions.setDelegatedIdentityKey({
                deviceId: device.id,
                delegatedKey: null,
            }),
        );
    };

    return isSuiteSyncEnabled ? (
        <Row gap={spacings.xxs}>
            🐞
            {isLegacyLabelingEnabled && <Text intent="accentViolet">[Legacy]</Text>}
            {isSuiteSyncEnabled && (
                <>
                    <Text typographyStyle="body-sm" intent="warning">
                        <Code>{walletDescriptor.slice(-8)}</Code>
                    </Text>
                    @
                    <Text typographyStyle="body-sm" intent="accentViolet">
                        <Code>{deviceId.slice(-8)}</Code>
                    </Text>
                    <Tooltip content={<Code>{JSON.stringify(suiteSyncOwner, null, 2)}</Code>}>
                        <Text typographyStyle="body-sm" intent="accentViolet">
                            E:
                            <Code>{suiteSyncOwner?.slice(-8)}</Code>
                        </Text>
                    </Tooltip>
                </>
            )}
            <span
                role="button"
                tabIndex={0}
                onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
                    event.stopPropagation();
                    event.preventDefault();
                    handleResetKeysRequest();
                }}
            >
                ❌
            </span>
        </Row>
    ) : null;
};
