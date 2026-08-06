import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { TorStatus, getIsTorDomain, torActions } from '@suite/tor';
import { getLocationHostname, isWeb } from '@trezor/env-utils';

type UseWebTorStatusParams = {
    onStatusChange: (params: { status: TorStatus }) => void;
};

// On web there is no Tor daemon to control; the status is derived purely from
// whether the app is being served over an `.onion` domain.
export const useWebTorStatus = ({ onStatusChange }: UseWebTorStatusParams) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!isWeb()) {
            return;
        }

        const isTorDomain = getIsTorDomain(getLocationHostname());
        const newTorStatus = isTorDomain ? TorStatus.Enabled : TorStatus.Disabled;

        dispatch(torActions.setTorStatus(newTorStatus));
        onStatusChange({ status: newTorStatus });
    }, [dispatch, onStatusChange]);
};
