import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { type MetadataProviderType } from '@suite-common/metadata-types';
import type { Deferred } from '@trezor/utils';

import { MetadataProviderSelectionModal } from './MetadataProviderSelectionModal';
import { connectProvider } from './metadataProviderThunks';

type MetadataProviderModalProps = {
    onCancel: () => void;
    decision: Deferred<boolean>;
};

export const MetadataProviderModal = ({ onCancel, decision }: MetadataProviderModalProps) => {
    const [isLoading, setIsLoading] = useState<MetadataProviderType | ''>('');
    // error from authorization popup
    const [error, setError] = useState('');

    const dispatch = useDispatch();

    const onModalCancel = () => {
        decision.resolve(false);
        onCancel();
    };

    const connect = async (type: MetadataProviderType) => {
        setIsLoading(type);
        const result = await dispatch(connectProvider({ type }));
        // window close indicates user action, user knows what happened, no need to show an error message
        if (result === 'window closed') {
            setIsLoading('');

            // stop here, user might have changed his decision and wants to use another provider
            return;
        }
        if (typeof result === 'string') {
            setError(result);
            setIsLoading('');

            return;
        }

        decision.resolve(true);
        onCancel();
    };

    return (
        <MetadataProviderSelectionModal
            onCancel={onModalCancel}
            onSelect={connect}
            isLoading={isLoading}
            error={error}
        />
    );
};
