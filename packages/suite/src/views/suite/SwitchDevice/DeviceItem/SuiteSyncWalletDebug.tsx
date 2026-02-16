/* eslint-disable jsx-a11y/click-events-have-key-events */
import {
    isSuiteSyncSupportedByDevice,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
    setSuiteSyncOwner,
} from '@suite-common/suite-sync';
import { AcquiredDevice } from '@suite-common/suite-types';
import { deviceActions } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Code, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const SuiteSyncWalletDebug = ({ device }: { device: AcquiredDevice }) => {
    const dispatch = useDispatch();

    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const legacyMetadataState = useSelector(state => state.metadata);

    const deviceStaticSessionId = device.state?.staticSessionId;
    const suiteSyncOwner = useSelector(state =>
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
            {legacyMetadataState.enabled && <Text intent="accentViolet">[Legacy]</Text>}
            {isSuiteSyncEnabled && (
                <>
                    <Text typographyStyle="hint" intent="warning">
                        <Code>{walletDescriptor.slice(-8)}</Code>
                    </Text>
                    @
                    <Text typographyStyle="hint" intent="accentViolet">
                        <Code>{deviceId.slice(-8)}</Code>
                    </Text>
                    <Tooltip content={<Code>{JSON.stringify(suiteSyncOwner, null, 2)}</Code>}>
                        <Text typographyStyle="hint" intent="accentViolet">
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
