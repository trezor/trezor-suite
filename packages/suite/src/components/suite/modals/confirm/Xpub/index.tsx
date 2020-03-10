import React, { createRef } from 'react';
import styled from 'styled-components';
import { Button, H2, colors } from '@trezor/components';
import { copyToClipboard } from '@suite-utils/dom';
import { Translation, QrCode } from '@suite-components';

import { Props } from './Container';

const StyledWrapper = styled.div`
    max-width: 600px;
    padding: 40px;
`;

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

export default ({ xpub, accountPath, accountIndex, symbol, addNotification }: Props) => {
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
        <StyledWrapper>
            <H2>
                <Translation
                    id="TR_XPUB_MODAL_TITLE"
                    values={{ networkName: symbol.toUpperCase(), accountIndex: accountIndex + 1 }}
                />
            </H2>
            <QrCode value={xpub} addressPath={accountPath} />
            <Address data-test="@xpub-modal/xpub-field">{xpub}</Address>
            <Row ref={htmlElement}>
                <Button variant="secondary" onClick={copyAddress}>
                    <Translation id="TR_XPUB_MODAL_CLIPBOARD" />
                </Button>
            </Row>
        </StyledWrapper>
    );
};
