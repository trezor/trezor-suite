import { Column } from '@trezor/components';

import { ServiceWorkerDebugOption } from './ServiceWorkerDebugOption';

const UPDATE_PROMPT_HINT =
    'Production builds show the update banner when a newer version waits. This shows it on develop, preview and local builds as well.';
const DEV_LOGS_HINT =
    'Dev builds only. Registers the worker again, and the new one takes over with Activate waiting version.';

export type ServiceWorkerDebugOptionsProps = {
    isUpdatePromptEnabled: boolean;
    onUpdatePromptEnabledChange: (isEnabled: boolean) => void;
    /** Serwist keeps its logs only in dev builds, so the option is offered only there. */
    isDevLogsAvailable: boolean;
    isDevLogsEnabled: boolean;
    onDevLogsEnabledChange: (isEnabled: boolean) => void;
};

export const ServiceWorkerDebugOptions = ({
    isUpdatePromptEnabled,
    onUpdatePromptEnabledChange,
    isDevLogsAvailable,
    isDevLogsEnabled,
    onDevLogsEnabledChange,
}: ServiceWorkerDebugOptionsProps) => (
    <Column gap={12} alignItems="flex-start">
        <ServiceWorkerDebugOption
            data-testid="@settings/debug/service-worker/update-prompt-switch"
            label="Update prompt on every build"
            hint={UPDATE_PROMPT_HINT}
            isChecked={isUpdatePromptEnabled}
            onChange={onUpdatePromptEnabledChange}
        />
        {isDevLogsAvailable && (
            <ServiceWorkerDebugOption
                data-testid="@settings/debug/service-worker/dev-logs-switch"
                label="Serwist dev logs"
                hint={DEV_LOGS_HINT}
                isChecked={isDevLogsEnabled}
                onChange={onDevLogsEnabledChange}
            />
        )}
    </Column>
);
