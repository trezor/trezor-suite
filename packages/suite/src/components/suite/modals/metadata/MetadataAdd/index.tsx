import React, { useRef } from 'react';
import styled from 'styled-components';
import { Modal, Button, Input } from '@trezor/components';
// import { Translation } from '@suite-components';
// import { useActions } from '@suite-hooks';
// import * as metadataActions from '@suite-actions/metadataActions';
import { UserContextPayload } from '@suite-actions/modalActions';

type Props = {
    onCancel: () => void;
} & Extract<UserContextPayload, { type: 'metadata-add' }>;

const Buttons = styled.div`
    margin-top: 12px;
    display: flex;
    flex-direction: column;
`;

const MetadataAdd = (props: Props) => {
    const ref = useRef<HTMLInputElement>(null);
    const { payload } = props;

    const add = () => {
        if (!ref.current) return;
        props.decision.resolve(ref.current.value);
        props.onCancel();
    };

    const onCancel = () => {
        props.decision.resolve(undefined);
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
        <Modal cancelable onCancel={onCancel} heading={header} description={payload.defaultValue}>
            <Input innerRef={ref} defaultValue={payload.value || ''} />
            <Buttons>
                <Button onClick={add}>Save</Button>
            </Buttons>
        </Modal>
    );
};

export default MetadataAdd;
