import React, { createRef } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { Translation, Modal } from '@suite-components';
import { Account } from '@wallet-types';
import * as notificationActions from '@suite-actions/notificationActions';
import { useActions } from '@suite-hooks';
import QrCode from '@suite-components/QrCode';

const Address = styled.div`
    width: 100%;
    background: ${props => props.theme.BG_LIGHT_GREY};
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 6px;
    word-break: break-all;
    font-size: 20px;
    padding: 20px;
    margin: 20px 0 40px 0;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;

    button + button {
        margin-top: 10px;
    }
`;

const StyledQrCode = styled(QrCode)`
    align-self: center;
`;

interface Props {
    xpub: string;
    accountIndex: number;
    symbol: Account['symbol'];
    accountLabel: Account['metadata']['accountLabel'];
    onCancel: () => void;
}

const Xpub = ({ xpub, accountIndex, symbol, accountLabel, onCancel }: Props) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;
    const { addNotification } = useActions({
        addNotification: notificationActions.addToast,
    });

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
                accountLabel ? (
                    <Translation id="TR_XPUB_MODAL_TITLE_METADATA" values={{ accountLabel }} />
                ) : (
                    <Translation
                        id="TR_XPUB_MODAL_TITLE"
                        values={{
                            networkName: symbol.toUpperCase(),
                            accountIndex: `#${accountIndex + 1}`,
                        }}
                    />
                )
            }
        >
            <StyledQrCode value={xpub} />
            <Address data-test="@xpub-modal/xpub-field">{xpub}</Address>
            <Row ref={htmlElement}>
                <Button variant="primary" onClick={copyAddress}>
                    <Translation id="TR_XPUB_MODAL_CLIPBOARD" />
                </Button>
            </Row>
        </Modal>
    );
};

export default Xpub;
