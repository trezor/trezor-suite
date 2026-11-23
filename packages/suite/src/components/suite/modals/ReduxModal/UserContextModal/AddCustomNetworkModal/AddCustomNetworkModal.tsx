import { useState } from 'react';

import { type CustomNetworkCatalogueEntry } from '#src/utils/settings/customNetworks/customNetworkCatalogue';

import { CustomNetworkDetailStep } from './CustomNetworkDetailStep';
import { CustomNetworkListStep } from './CustomNetworkListStep';

type AddCustomNetworkModalProps = {
    onCancel: () => void;
};

export const AddCustomNetworkModal = ({ onCancel }: AddCustomNetworkModalProps) => {
    const [selectedNetwork, setSelectedNetwork] = useState<CustomNetworkCatalogueEntry | null>(
        null,
    );

    if (selectedNetwork) {
        return (
            <CustomNetworkDetailStep
                entry={selectedNetwork}
                onBackClick={() => setSelectedNetwork(null)}
                onCancel={onCancel}
            />
        );
    }

    return <CustomNetworkListStep onSelect={setSelectedNetwork} onCancel={onCancel} />;
};
