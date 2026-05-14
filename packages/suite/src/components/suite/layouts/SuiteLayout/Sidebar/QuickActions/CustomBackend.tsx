import { goto } from '@suite/router';
import { QuickActionButton } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';

import { NavBackends } from './NavBackends';
import { useEnabledBackends } from '../../utils';

export const CustomBackend = () => {
    const dispatch = useDispatch();
    const enabledBackends = useEnabledBackends();
    const isCustomBackendIconVisible = enabledBackends.length > 0;

    const handleClick = () => {
        dispatch(goto({ routeName: 'settings-coins' }));
    };

    return (
        isCustomBackendIconVisible && (
            <QuickActionButton
                tooltip={{ content: <NavBackends customBackends={enabledBackends} /> }}
                onClick={handleClick}
                iconName="database"
                subIconIntent="brand"
                subIconName="check"
            />
        )
    );
};
