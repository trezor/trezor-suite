import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    LogsApplicationInfoRootState,
    selectRedactedActionsLog,
    selectRedactedApplicationInfo,
} from '../logsSelectors';
import { LogsSliceRootState } from '../logsSlice';
import { LogsEnvironmentInfo, getEnvironmentInfo, startTime } from '../utils';

export const useCommonApplicationLogs = (hideSensitiveInfo: boolean) => {
    const redactedActionsLog = useSelector((state: LogsSliceRootState) =>
        selectRedactedActionsLog(state, hideSensitiveInfo),
    );
    const redactedApplicationInfo = useSelector((state: LogsApplicationInfoRootState) =>
        selectRedactedApplicationInfo(state, hideSensitiveInfo),
    );

    const [envInfo, setEnvInfo] = useState<LogsEnvironmentInfo | null>(null);
    useEffect(() => {
        (async () => setEnvInfo(await getEnvironmentInfo()))();
    }, []);

    if (envInfo === null) return null;

    return [{ ...envInfo, startTime, ...redactedApplicationInfo }, redactedActionsLog];
};
