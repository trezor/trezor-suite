import { useState } from 'react';

import { injectReloadApp } from '@suite-common/suite-types';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { RepeatIcon } from '@trezor/icons';
import { injectDispatch, injectGetState } from '@trezor/redux-utils';

import { resetCustomServersThunk } from 'src/actions/suite/suiteThunks';
import { selectHasCustomServers } from 'src/selectors/suite/backendSelectors';

export const ResetCustomServersButton = () => {
    const { reloadApp, dispatch, getState } = useServices(
        injectReloadApp,
        injectDispatch,
        injectGetState,
    );
    // read once from the store: error screens can render outside the Redux provider
    const hasCustomServers = selectHasCustomServers(getState());
    const [isResetting, setIsResetting] = useState(false);

    if (!hasCustomServers) return null;

    return (
        <Button
            iconLeft={RepeatIcon}
            intent="neutral"
            priority="secondary"
            isLoading={isResetting}
            onClick={async () => {
                setIsResetting(true);
                try {
                    await dispatch(resetCustomServersThunk({ willReload: true }));
                } finally {
                    reloadApp();
                }
            }}
        >
            Reset custom servers and reload
        </Button>
    );
};
