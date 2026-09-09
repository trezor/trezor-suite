import { useEffect } from 'react';

import { preserveModal, removePreserveModal } from '@suite/modal';
import { prettifyLog, useCommonApplicationLogs } from '@suite-common/logger';
import { useDispatch } from '@suite-common/redux-utils';
import { getSupportedNetworks } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import {
    type SuiteLogsApplicationInfoRootState,
    selectRedactedDesktopApplicationInfo,
} from 'src/selectors/suite/logsSelectors';

export const useApplicationLogs = ({ hideSensitiveInfo }: { hideSensitiveInfo: boolean }) => {
    const supportedNetworks = getSupportedNetworks();

    const dispatch = useDispatch();
    const commonAppLogs = useCommonApplicationLogs(hideSensitiveInfo);
    const desktopApplicationInfo = useSelector((state: SuiteLogsApplicationInfoRootState) =>
        selectRedactedDesktopApplicationInfo(state, hideSensitiveInfo, supportedNetworks),
    );

    useEffect(() => {
        // Preserve modal while fetching device telemetry from Connect
        // This is required due to CLOSE_UI_WINDOW event
        dispatch(preserveModal());

        return () => {
            dispatch(removePreserveModal());
        };
    }, [dispatch]);

    if (commonAppLogs === null) return null;

    return prettifyLog([{ ...commonAppLogs[0], ...desktopApplicationInfo }, commonAppLogs[1]]);
};
