import React from 'react';
import styled from 'styled-components';
import { Modal, Button } from '@trezor/components';
// import { Translation } from '@suite-components';
import { UserContextPayload } from '@suite-actions/modalActions';
// import { DEFAULT_PAYMENT, DEFAULT_OPRETURN } from '@wallet-constants/sendForm';

const Description = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
`;

type Props = {
    onCancel: () => any;
    decision: Extract<UserContextPayload, { type: 'import-transaction' }>['decision'];
};

const ImportTransaction = ({ onCancel, decision }: Props) => {
    // TODO:
    // - views and Translations
    // - delimiter (default ,)
    // - upload button
    // - upload drag&drop area
    // - parse uploaded file with error handler, similar to QRCode reader

    // result from uploaded file
    const validData = {
        outputs: [
            {
                type: 'payment',
                address: '0x7de62F23453E9230cC038390901A9A0130105A3c',
                amount: '0.1',
            } as const,
            // { ...DEFAULT_PAYMENT, address: 'address' },
            // { ...DEFAULT_PAYMENT, amount: '1' },
            // // { label: 'label' },
            // // { fiat: '1' },
            // { ...DEFAULT_OPRETURN },
        ],
    };
    const invalidData = {
        outputs: [
            {
                type: 'payment',
                address: '0x7de62F23453E9230cC038390901A9A0130105A3c',
                amount: '',
            } as const,
        ],
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading="upload file"
            description={<Description>File format description</Description>}
        >
            <Actions>
                <Button
                    variant="secondary"
                    onClick={() => {
                        decision.resolve(validData);
                        onCancel();
                    }}
                >
                    UPLOAD VALID
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => {
                        decision.resolve(invalidData);
                        onCancel();
                    }}
                >
                    UPLOAD INVALID
                </Button>
            </Actions>
        </Modal>
    );
};

export default ImportTransaction;
