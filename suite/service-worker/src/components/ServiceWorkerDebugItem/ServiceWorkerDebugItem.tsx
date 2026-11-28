import { Column, Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { ServiceWorkerDebugDetails } from './ServiceWorkerDebugDetails/ServiceWorkerDebugDetails';
import {
    ServiceWorkerDebugOptions,
    type ServiceWorkerDebugOptionsProps,
} from './ServiceWorkerDebugOptions/ServiceWorkerDebugOptions';
import { type ServiceWorkerControl } from '../../control/serviceWorkerControl';

const DESCRIPTION =
    'Caches the static files of this build and the token definitions for repeat visits and offline starts. Turning it off removes the worker and its caches and reloads every tab.';
const UNSUPPORTED_DESCRIPTION =
    'Not available: this browser or connection does not support service workers.';

type ServiceWorkerDebugItemProps = ServiceWorkerDebugOptionsProps & {
    isEnabled: boolean;
    onEnabledChange: (isEnabled: boolean) => void;
    serviceWorkerControl: ServiceWorkerControl;
};

export const ServiceWorkerDebugItem = ({
    isEnabled,
    onEnabledChange,
    serviceWorkerControl,
    ...optionsProps
}: ServiceWorkerDebugItemProps) => {
    const isSupported = serviceWorkerControl.isSupported();

    return (
        <SectionItem
            data-testid="@settings/debug/service-worker"
            title="Service worker"
            description={isSupported ? DESCRIPTION : UNSUPPORTED_DESCRIPTION}
            bottomContent={
                isEnabled &&
                isSupported && (
                    <Column gap={16} alignItems="flex-start">
                        <ServiceWorkerDebugDetails serviceWorkerControl={serviceWorkerControl} />
                        <ServiceWorkerDebugOptions {...optionsProps} />
                    </Column>
                )
            }
            actions={
                <Switch
                    data-testid="@settings/debug/service-worker/switch"
                    isChecked={isEnabled}
                    isDisabled={!isSupported}
                    onChange={onEnabledChange}
                />
            }
        />
    );
};
