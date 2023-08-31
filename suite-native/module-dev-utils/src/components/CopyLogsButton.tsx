import { useSelector } from 'react-redux';

import { selectLogs } from '@suite-common/logger';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Button } from '@suite-native/atoms';

export const CopyLogsButton = () => {
    const logs = useSelector(selectLogs);
    const copyToClipboard = useCopyToClipboard();

    const handleCopy = async () => {
        await copyToClipboard(JSON.stringify(logs), 'Logs copied');
    };

    return <Button onPress={handleCopy}>Copy logs</Button>;
};
