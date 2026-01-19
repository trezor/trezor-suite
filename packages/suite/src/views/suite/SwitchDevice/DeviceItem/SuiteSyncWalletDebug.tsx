/* eslint-disable jsx-a11y/click-events-have-key-events */
import {
    isSuiteSyncSupportedByDevice,
    selectIsSuiteSyncDebugEnabled,
    selectIsSuiteSyncEnabled,
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

    if (
        !isSuiteSyncDebugEnabled ||
        !isSuiteSyncSupportedByDevice(device) ||
        !device.state?.staticSessionId
    ) {
        return;
    }

    const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(device.state.staticSessionId);

    const handleResetKeysRequest = () => {
        if (!device?.id || device.state?.staticSessionId === undefined) {
            return;
        }

        dispatch(
            deviceActions.setSuiteSyncOwner({
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
            {legacyMetadataState.enabled && <Text variant="purple">[Legacy]</Text>}
            {isSuiteSyncEnabled && (
                <>
                    <Text typographyStyle="hint" variant="warning">
                        <Code>{walletDescriptor.slice(-8)}</Code>
                    </Text>
                    @
                    <Text typographyStyle="hint" variant="purple">
                        <Code>{deviceId.slice(-8)}</Code>
                    </Text>
                    <Tooltip
                        content={<Code>{JSON.stringify(device.suiteSyncOwner, null, 2)}</Code>}
                    >
                        <Text typographyStyle="hint" variant="purple">
                            E:
                            <Code>{device.suiteSyncOwner?.slice(-8)}</Code>
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
