import { Tor } from './Tor';
import { TorExternal } from './TorExternal';

type TorSettingsProps = {
    // See `Tor` — resolves `true` to keep Tor running (abort switching it off).
    onBeforeDisable?: () => Promise<boolean>;
    // Whether the experimental external-port setting should be shown.
    isExternalPortVisible?: boolean;
};

// Desktop Tor settings section: the daemon on/off toggle plus the experimental external-port option.
export const TorSettings = ({ onBeforeDisable, isExternalPortVisible }: TorSettingsProps) => (
    <>
        <Tor onBeforeDisable={onBeforeDisable} />
        {isExternalPortVisible && <TorExternal />}
    </>
);
