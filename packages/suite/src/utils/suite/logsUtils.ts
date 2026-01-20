import { prettifyLog, useCommonApplicationLogs } from '@suite-common/logger';

import { useSelector } from 'src/hooks/suite';

import {
    SuiteLogsApplicationInfoRootState,
    selectRedactedDesktopApplicationInfo,
} from '../../selectors/suite/logsSelectors';

export const useApplicationLogs = ({ hideSensitiveInfo }: { hideSensitiveInfo: boolean }) => {
    const commonAppLogs = useCommonApplicationLogs(hideSensitiveInfo);
    const desktopApplicationInfo = useSelector((state: SuiteLogsApplicationInfoRootState) =>
        selectRedactedDesktopApplicationInfo(state, hideSensitiveInfo),
    );

    if (commonAppLogs === null) return null;

    return prettifyLog([{ ...commonAppLogs[0], ...desktopApplicationInfo }, commonAppLogs[1]]);
};
