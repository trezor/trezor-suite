import { AcquiredDevice } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Code, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useLabelingCombined } from '../../../../hooks/suite/useLabelingCombined';

export const LocalFirstStorageDebug = ({ device }: { device: AcquiredDevice }) => {
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
        </Row>
    ) : null;
};
