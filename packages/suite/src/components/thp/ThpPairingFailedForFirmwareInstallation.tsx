import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';
import { useSelector } from '../../hooks/suite';

export const ThpPairingFailedForFirmwareInstallation = () => {
    const lastThpCode = useSelector(state => state.thp.lastThpCode);

    return <ThpPairingCodeEntry disabled lastCode={lastThpCode} />;
};
