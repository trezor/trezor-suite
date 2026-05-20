import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type SuiteSettingsRootState, selectTorOnionLinks } from '@suite/settings';
import { TorStatus } from '@trezor/suite-desktop-api';

import { getTorUrlIfAvailable } from './getTorUrlIfAvailable';

interface ExternalLinksRootState extends SuiteSettingsRootState {
    suite: {
        torStatus: TorStatus;
    };
}

const selectIsTorEnabled = (state: ExternalLinksRootState) => {
    const { torStatus } = state.suite;

    return torStatus === TorStatus.Enabled || torStatus === TorStatus.Slow;
};

/**
 * Returns plain url or onion url if available and tor is active
 */
export const useExternalLink = (originalUrl?: string) => {
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const torOnionLinks = useSelector(selectTorOnionLinks);

    const url = useMemo(() => {
        if (originalUrl && isTorEnabled && torOnionLinks) {
            return getTorUrlIfAvailable(originalUrl) || originalUrl;
        }

        return originalUrl;
    }, [isTorEnabled, torOnionLinks, originalUrl]);

    return url;
};
