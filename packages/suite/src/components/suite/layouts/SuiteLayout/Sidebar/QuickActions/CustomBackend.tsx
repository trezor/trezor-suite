import { gotoThunk } from '@suite/router';
import { type IconComponent, type UIIntent } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowsClockwiseIcon, CheckIcon, DatabaseIcon, WarningIcon } from '@trezor/icons';
import { QuickActionButton } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';
import {
    type BackendConnectionStatus,
    selectCustomBackendsStatus,
} from 'src/selectors/suite/backendSelectors';

import { NavBackends } from './NavBackends';
import { useEnabledBackends } from '../../utils';

const statusIconMap: Record<BackendConnectionStatus, IconComponent> = {
    connected: CheckIcon,
    connecting: ArrowsClockwiseIcon,
    failed: WarningIcon,
};

const statusIntentMap: Record<BackendConnectionStatus, UIIntent> = {
    connected: 'brand',
    connecting: 'info',
    failed: 'warning',
};

export const CustomBackend = () => {
    const { dispatch } = useServices(injectDispatch);
    const enabledBackends = useEnabledBackends();
    const customBackendsStatus = useSelector(selectCustomBackendsStatus);
    const isCustomBackendIconVisible = enabledBackends.length > 0;

    const handleClick = () => {
        dispatch(gotoThunk({ routeName: 'settings-coins' }));
    };

    return (
        isCustomBackendIconVisible && (
            <QuickActionButton
                tooltip={{ content: <NavBackends customBackends={enabledBackends} /> }}
                onClick={handleClick}
                data-testid="@quickActions/customBackend"
                icon={DatabaseIcon}
                subIconIntent={statusIntentMap[customBackendsStatus]}
                subIcon={statusIconMap[customBackendsStatus]}
            />
        )
    );
};
