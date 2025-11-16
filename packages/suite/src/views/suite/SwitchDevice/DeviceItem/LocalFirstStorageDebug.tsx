/* eslint-disable jsx-a11y/click-events-have-key-events */
import { AcquiredDevice } from '@suite-common/suite-types';
import { deviceActions } from '@suite-common/wallet-core';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Code, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

import { useLabelingCombined } from '../../../../hooks/suite/useLabelingCombined';

export const LocalFirstStorageDebug = ({ device }: { device: AcquiredDevice }) => {
    const dispatch = useDispatch();
    const {
        legacyMetadataState,
        isLocalFirstStorageEnabled,
        isLocalFirstStorageDebugEnabled,
        isEvoluSupportedByDevice,
    } = useLabelingCombined({ deviceStaticSessionId: device.state?.staticSessionId });

    if (
        !isLocalFirstStorageDebugEnabled ||
        !isEvoluSupportedByDevice ||
        !device.state?.staticSessionId
    ) {
        return;
    }

    const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(device.state.staticSessionId);

    const handleResetKeysRequest = () => {
        if (!device?.id) return;

        dispatch(deviceActions.setLocalFirstStorageSecret({ device, evoluKeys: undefined }));
        dispatch(
            deviceActions.setDelegatedIdentityKey({
                deviceId: device.id,
                delegatedKey: null,
            }),
        );
    };

    return isLocalFirstStorageEnabled ? (
        <Row gap={spacings.xxs}>
            🐞
            {legacyMetadataState.enabled && <Text variant="purple">[Legacy]</Text>}
            {isLocalFirstStorageEnabled && (
                <>
                    <Text typographyStyle="hint" variant="warning">
                        <Code>{walletDescriptor.slice(-8)}</Code>
                    </Text>
                    @
                    <Text typographyStyle="hint" variant="purple">
                        <Code>{deviceId.slice(-8)}</Code>
                    </Text>
                    <Tooltip
                        content={
                            <Code>{JSON.stringify(device.localFirstStorageSecret, null, 2)}</Code>
                        }
                    >
                        <Text typographyStyle="hint" variant="purple">
                            E:
                            <Code>
                                {device.localFirstStorageSecret?.evoluKeys?.ownerId.slice(-8)}
                            </Code>
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
