import React, { createRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as notificationActions from '@suite-actions/notificationActions';
import { Button, H2, colors } from '@trezor/components-v2';
import { copyToClipboard } from '@suite-utils/dom';
import { Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import { Translation, QrCode } from '@suite-components';
import messages from '@suite/support/messages';

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

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addNotification: bindActionCreators(notificationActions.add, dispatch),
});

type Props = {
    xpub: string;
    accountPath: string;
    accountIndex: number;
    accountType: Account['accountType'];
    symbol: Account['symbol'];
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const ConfirmAddress = ({ xpub, accountPath, accountIndex, symbol, addNotification }: Props) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;

    const htmlElement = createRef<HTMLDivElement>();

    const copyAddress = () => {
        const result = copyToClipboard(xpub, htmlElement.current);
        if (typeof result === 'string') {
            addNotification({ type: 'copy-to-clipboard-error', error: result });
        } else {
            addNotification({ type: 'copy-to-clipboard-success', payload: xpub });
        }
    };

    return (
        <StyledWrapper>
            <H2>
                <Translation
                    {...messages.TR_XPUB_MODAL_TITLE}
                    values={{ networkName: symbol.toUpperCase(), accountIndex: accountIndex + 1 }}
                />
            </H2>
            <QrCode value={xpub} addressPath={accountPath} />
            <Address data-test="@xpub-modal/xpub-field">{xpub}</Address>
            <Row ref={htmlElement}>
                <Button variant="secondary" onClick={copyAddress}>
                    <Translation {...messages.TR_XPUB_MODAL_CLIPBOARD} />
                </Button>
            </Row>
        </StyledWrapper>
    );
};

export default connect(null, mapDispatchToProps)(ConfirmAddress);
