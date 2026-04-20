import { useSelector } from 'react-redux';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';

export const ThpPairingFailedForFirmwareInstallation = () => {
    const lastThpCode = useSelector(
        (state: { thp: { lastThpCode?: string } }) => state.thp.lastThpCode,
    );

    return <ThpPairingCodeEntry disabled lastCode={lastThpCode} />;
};
