import { useState } from 'react';

import { Button, Column, Row, Text } from '@trezor/components';

import { ServiceWorkerStatusDetails } from './ServiceWorkerStatusDetails';
import { useServiceWorkerStatus } from './useServiceWorkerStatus';
import { type ServiceWorkerControl } from '../../../control/serviceWorkerControl';

type ServiceWorkerDebugDetailsProps = {
    serviceWorkerControl: ServiceWorkerControl;
};

export const ServiceWorkerDebugDetails = ({
    serviceWorkerControl,
}: ServiceWorkerDebugDetailsProps) => {
    const [actionError, setActionError] = useState<string | null>(null);
    const statusResult = useServiceWorkerStatus({ serviceWorkerControl });

    const handleCheckForUpdate = async () => {
        const result = await serviceWorkerControl.checkForUpdate();

        setActionError(result.success ? null : result.error);
    };

    const handleActivateWaiting = async () => {
        const result = await serviceWorkerControl.activateWaiting();

        setActionError(result.success ? null : result.error);
    };

    const isRegistered = statusResult?.success === true && statusResult.payload !== null;
    const isUpdateWaiting =
        statusResult?.success === true && !!statusResult.payload?.isUpdateWaiting;

    return (
        <Column gap={12} alignItems="flex-start">
            <ServiceWorkerStatusDetails statusResult={statusResult} />
            <Row gap={8} flexWrap="wrap">
                <Button
                    data-testid="@settings/debug/service-worker/check-for-update"
                    size="small"
                    priority="secondary"
                    isDisabled={!isRegistered}
                    onClick={handleCheckForUpdate}
                >
                    Check for update
                </Button>
                <Button
                    data-testid="@settings/debug/service-worker/activate-waiting"
                    size="small"
                    priority="secondary"
                    isDisabled={!isUpdateWaiting}
                    onClick={handleActivateWaiting}
                >
                    Activate waiting version
                </Button>
            </Row>
            {actionError !== null && (
                <Text typographyStyle="body-sm" intent="critical">
                    {actionError}
                </Text>
            )}
        </Column>
    );
};
