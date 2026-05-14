import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useQuery } from '@suite-common/react-query';
import TrezorConnect, { type PROTO } from '@trezor/connect';

import {
    type LogsApplicationInfoRootState,
    type RedactedDevice,
    selectRedactedActionsLog,
    selectRedactedApplicationInfo,
} from '../logsSelectors';
import { type LogsSliceRootState } from '../logsSlice';
import { type LogsEnvironmentInfo, getEnvironmentInfo, startTime } from '../utils';

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

    // Enhance devices info with telemetry data (battery temp, etc.)
    const devicePaths = new Set(redactedApplicationInfo.devices.map(d => d.path));
    const { data: devicesWithTelemetry, isLoading } = useQuery({
        queryKey: ['device-telemetry', ...devicePaths],
        queryFn: async ({ signal }) => {
            const _devicesWithTelemetry: (RedactedDevice & { telemetry?: PROTO.Telemetry })[] = [
                ...redactedApplicationInfo.devices,
            ];
            for (const device of _devicesWithTelemetry) {
                if (signal.aborted) break;
                const telemetry = await TrezorConnect.telemetryGet({
                    device: { path: device.path },
                });
                if (!telemetry.success) continue;
                device.telemetry = telemetry.payload;
            }

            return _devicesWithTelemetry;
        },
        staleTime: 60 * 1000,
    });
    if (envInfo === null || isLoading) return null;

    return [
        {
            ...envInfo,
            startTime,
            ...redactedApplicationInfo,
            devices: devicesWithTelemetry ?? redactedApplicationInfo.devices,
        },
        redactedActionsLog,
    ];
};
