import React, { createRef } from 'react';
import styled from 'styled-components';
import { Button, Modal, colors } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { Translation, QrCode } from '@suite-components';

import { Props } from './Container';

const Address = styled.div`
    width: 100%;
    background: ${colors.BLACK96};
    border: 1px solid ${colors.BLACK80};
    border-radius: 6px;
    word-break: break-all;
    font-size: 20px;
    padding: 20px;
    margin-bottom: 40px;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;

    button + button {
        margin-top: 10px;
    }
`;

export default ({ xpub, accountPath, accountIndex, symbol, addNotification, onCancel }: Props) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;

    const htmlElement = createRef<HTMLDivElement>();

    const copyAddress = () => {
        const result = copyToClipboard(xpub, htmlElement.current);
        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
        }
    };

    return (
        <Modal
            size="small"
            cancelable
            onCancel={onCancel}
            heading={
                <Translation
                    id="TR_XPUB_MODAL_TITLE"
                    values={{ networkName: symbol.toUpperCase(), accountIndex: accountIndex + 1 }}
                />
            }
        >
            <QrCode value={xpub} addressPath={accountPath} />
            <Address data-test="@xpub-modal/xpub-field">{xpub}</Address>
            <Row ref={htmlElement}>
                <Button variant="primary" onClick={copyAddress}>
                    <Translation id="TR_XPUB_MODAL_CLIPBOARD" />
                </Button>
            </Row>
        </Modal>
    );
};
