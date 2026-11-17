import { useState } from 'react';

import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';

import { CustomNetworkDetailStep } from './CustomNetworkDetailStep';
import { CustomNetworkListStep } from './CustomNetworkListStep';

type AddCustomNetworkModalProps = {
    onCancel: () => void;
};

export const AddCustomNetworkModal = ({ onCancel }: AddCustomNetworkModalProps) => {
    const [selectedNetwork, setSelectedNetwork] = useState<CustomEvmNetworkDefinition | null>(null);

    if (selectedNetwork) {
        return (
            <CustomNetworkDetailStep
                network={selectedNetwork}
                onBackClick={() => setSelectedNetwork(null)}
                onCancel={onCancel}
            />
        );
    }

    return <CustomNetworkListStep onSelect={setSelectedNetwork} onCancel={onCancel} />;
};
