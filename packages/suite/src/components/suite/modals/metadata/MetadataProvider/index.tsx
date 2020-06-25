import React, { useState } from 'react';
import { Modal, Button } from '@trezor/components';
// import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { Deferred } from '@suite-utils/deferred';
import { MetadataProviderType } from '@suite-types/metadata';

type Props = {
    onCancel: () => void;
    decision: Deferred<boolean>;
};

const MetadataProvider = (props: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const { connectProvider } = useActions({ connectProvider: metadataActions.connectProvider });

    const onCancel = () => {
        props.decision.resolve(false);
        props.onCancel();
    };

    const connect = async (type: MetadataProviderType) => {
        setIsLoading(true);
        const result = await connectProvider(type);
        if (!result) {
            setIsLoading(false);
            // TODO: error state, try again
            return;
        }

        props.decision.resolve(true);
        props.onCancel();
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            size="tiny"
            heading="Cloud sync"
            description="Do you want to sync your labeling with selected data provider?"
        >
            <Button onClick={() => connect('dropbox')} isLoading={isLoading}>
                Dropbox
            </Button>
            <Button
                onClick={() => connect('google')}
                isLoading={isLoading}
                style={{ marginTop: '20px', marginBottom: '20px' }}
            >
                Google drive
            </Button>
            {/* TODO: electron only */}
            <Button onClick={() => connect('userData')} variant="secondary" isLoading={isLoading}>
                Local file system
            </Button>
        </Modal>
    );
};

export default MetadataProvider;
