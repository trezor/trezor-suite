import { useState } from 'react';

import { FirmwareInstallationProgressCheckFail } from './FirmwareInstallationProgressCheckFail';
import { FirmwareInstallationProgressCheckPrompt } from './FirmwareInstallationProgressCheckPrompt';

type FirmwareInstallationProgressCheckProps = {
    handleDismiss: () => void;
};

export const FirmwareInstallationProgressCheck = ({
    handleDismiss,
}: FirmwareInstallationProgressCheckProps) => {
    const [isFailed, setIsFailed] = useState(false);
    const toggleView = () => setIsFailed(current => !current);

    return isFailed ? (
        <FirmwareInstallationProgressCheckFail toggleView={toggleView} />
    ) : (
        <FirmwareInstallationProgressCheckPrompt
            toggleView={toggleView}
            handleDismiss={handleDismiss}
        />
    );
};
