import React, { useRef } from 'react';
import { Modal, Button, Input } from '@trezor/components';
// import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as metadataActions from '@suite-actions/metadataActions';
import { UserContextPayload } from '@suite-actions/modalActions';

type Props = {
    onCancel: () => void;
} & Extract<UserContextPayload, { type: 'metadata-add' }>;

const MetadataAdd = (props: Props) => {
    const ref = useRef<HTMLInputElement>(null);
    const { payload } = props;

    const { addAccountMetadata } = useActions({
        addAccountMetadata: metadataActions.addAccountMetadata,
        connectProvider: metadataActions.connectProvider,
    });

    const addMetadata = () => {
        if (!ref.current) return;
        addAccountMetadata({ ...payload, value: ref.current.value });
        props.onCancel();
    };

    let header;
    switch (payload.type) {
        case 'accountLabel':
            header = 'Add account label';
            break;
        case 'addressLabel':
            header = 'Add address label';
            break;
        case 'outputLabel':
            header = 'Add output label';
            break;
        case 'walletLabel':
            header = 'Add wallet label';
            break;
        // no default
    }

    return (
        <Modal
            cancelable
            onCancel={props.onCancel}
            heading={header}
            description={payload.defaultValue}
        >
            <Input innerRef={ref} defaultValue={payload.value || ''} />
            <Button onClick={addMetadata}>Save</Button>
        </Modal>
    );
};

export default MetadataAdd;
