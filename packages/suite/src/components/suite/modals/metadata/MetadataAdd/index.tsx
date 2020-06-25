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
    const { addAccountMetadata } = useActions({
        addAccountMetadata: metadataActions.addAccountMetadata,
        connectProvider: metadataActions.connectProvider,
    });

    const addMetadata = () => {
        if (!ref.current) return;
        addAccountMetadata({ ...props.payload, value: ref.current.value });
        props.onCancel();
    };

    return (
        <Modal cancelable onCancel={props.onCancel} heading="Add label" description="TODO">
            {props.payload.defaultValue}
            <Input innerRef={ref} defaultValue="A" />
            <Button onClick={addMetadata}>Save</Button>
        </Modal>
    );
};

export default MetadataAdd;
