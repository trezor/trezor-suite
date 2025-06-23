import { AcquiredDevice } from '@suite-common/suite-types';
import { Code, Row, Text } from '@trezor/components';

import { useSelector } from '../../../../hooks/suite';
import { selectSuiteFlags } from '../../../../reducers/suite/suiteReducer';

export const LocalFirstStorageDebug = ({ device }: { device: AcquiredDevice }) => {
    const { isLocalFirstStorageDebugEnabled } = useSelector(selectSuiteFlags);

    return isLocalFirstStorageDebugEnabled && device.state?.staticSessionId ? (
        <Row>
            <Text typographyStyle="hint" variant="purple">
                <Code>{device.state.staticSessionId.slice(-8)}</Code>
            </Text>
        </Row>
    ) : null;
};
