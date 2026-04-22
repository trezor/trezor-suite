import { useSelector } from 'react-redux';

import { selectThpLastCode } from '@suite-common/thp';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';

export const ThpPairingFailedForFirmwareInstallation = () => {
    const lastThpCode = useSelector(selectThpLastCode);

    return <ThpPairingCodeEntry disabled lastCode={lastThpCode} />;
};
