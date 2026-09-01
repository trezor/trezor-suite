import { useDispatch } from 'react-redux';

import { selectCoinjoinAccounts } from '@suite/coinjoin';
import { openDeferredModal } from '@suite/modal';
import { selectHasExperimentalFeature } from '@suite/settings';
import { TorSettings } from '@suite/tor-desktop';

import { useSelector } from 'src/hooks/suite';

import { SettingsGeneral } from './SettingsGeneral';

export const DesktopSettingsGeneral = () => {
    const coinjoinAccounts = useSelector(selectCoinjoinAccounts);
    const isExternalPortVisible = useSelector(selectHasExperimentalFeature('tor-external'));
    const dispatch = useDispatch();

    // Disabling Tor stops any active coinjoin; warn the user before switching Tor off.
    const handleBeforeTorDisable = async () => {
        if (coinjoinAccounts.length === 0) {
            return false;
        }

        const isKeepRunningTor = await dispatch(
            openDeferredModal({ type: 'disable-tor-stop-coinjoin' }),
        );

        return !!isKeepRunningTor;
    };

    return (
        <SettingsGeneral
            torSettings={
                <TorSettings
                    onBeforeDisable={handleBeforeTorDisable}
                    isExternalPortVisible={isExternalPortVisible}
                />
            }
        />
    );
};
