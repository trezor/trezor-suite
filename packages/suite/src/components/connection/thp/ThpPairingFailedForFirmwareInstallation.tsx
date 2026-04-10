import { useSelector } from 'src/hooks/suite';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';

export const ThpPairingFailedForFirmwareInstallation = () => {
    const lastThpCode = useSelector(state => state.thp.lastThpCode);

    return <ThpPairingCodeEntry disabled lastCode={lastThpCode} />;
};
