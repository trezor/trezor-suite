import { AcquiredDevice } from '@suite-common/suite-types';
import { Code, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { useSelector } from '../../../../hooks/suite';

export const LocalFirstStorageDebug = ({ device }: { device: AcquiredDevice }) => {
    const { isLocalFirstStorageDebugEnabled } = useSelector(selectSuiteFlags);

    return isLocalFirstStorageDebugEnabled && device.state?.staticSessionId ? (
        <Row gap={spacings.xxs}>
            <Text typographyStyle="hint" variant="warning">
                <Code>{device.state.staticSessionId.split('@')[0].slice(-8)}</Code>
            </Text>
            @
            <Text typographyStyle="hint" variant="purple">
                <Code>{device.state.staticSessionId.slice(-8)}</Code>
            </Text>
            <Tooltip
                content={<Code>{JSON.stringify(device.localFirstStorageSecret, null, 2)}</Code>}
            >
                <Text typographyStyle="hint" variant="purple">
                    E: <Code>{device.localFirstStorageSecret?.evoluKeys?.ownerId.slice(-8)}</Code>
                </Text>
            </Tooltip>
        </Row>
    ) : null;
};
