/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    type WithSuiteSyncAndDeviceState,
    isSuiteSyncSupportedByDevice,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
    selectSuiteSyncStorageSyncStatus,
    setSuiteSyncOwner,
} from '@suite-common/suite-sync';
import { type SuiteSyncStorageSyncStatus } from '@suite-common/suite-sync-storage';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { Code, Row, Text, Tooltip } from '@trezor/components';
import { parseStaticSessionId } from '@trezor/device-utils';
import { RelativeTime } from '@trezor/product-components';

type SyncStatusProps = {
    syncStatus: SuiteSyncStorageSyncStatus;
};

const SyncStatus = ({ syncStatus }: SyncStatusProps) => (
    <Text typographyStyle="body-sm" intent="accentViolet">
        S:
        <Code>
            {syncStatus.state}
            {syncStatus.errorType !== null && ` (${syncStatus.errorType})`}
        </Code>
        {syncStatus.syncedAt !== null && <RelativeTime timestamp={syncStatus.syncedAt} />}
    </Text>
);

type SuiteSyncWalletDebugProps = {
    device: AcquiredDevice;
    /** @deprecated this prop is a hack so we do not depend on Legacy Metadata Labeling */
    isLegacyLabelingVisible: boolean;
};

export const SuiteSyncWalletDebug = ({
    device,
    isLegacyLabelingVisible,
}: SuiteSyncWalletDebugProps) => {
    const { dispatch } = useServices(injectDispatch);

    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

    const deviceStaticSessionId = device.state?.staticSessionId;
    const suiteSyncOwner = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectSuiteSyncOwnerForDeviceStaticId(state, deviceStaticSessionId),
    );
    const syncStatus = useSelector((state: WithSuiteSyncAndDeviceState) =>
        deviceStaticSessionId === undefined
            ? null
            : selectSuiteSyncStorageSyncStatus(state, deviceStaticSessionId),
    );

    const isSuiteSyncDebug =
        isSuiteSyncDebugEnabled &&
        isSuiteSyncSupportedByDevice(device) &&
        deviceStaticSessionId !== undefined;

    if (!isSuiteSyncDebug) {
        return;
    }

    const { walletDescriptor, deviceId = '' } = parseStaticSessionId(deviceStaticSessionId);

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
            persistentDeviceDataActions.setDelegatedIdentityKey({
                deviceId: device.id,
                delegatedKey: null,
            }),
        );
    };

    return isSuiteSyncEnabled ? (
        <Row gap={4}>
            🐞
            {isLegacyLabelingVisible && <Text intent="accentViolet">[Legacy]</Text>}
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
                    {syncStatus !== null && <SyncStatus syncStatus={syncStatus} />}
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
