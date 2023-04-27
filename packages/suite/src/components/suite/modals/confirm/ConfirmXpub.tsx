import React, { useRef } from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { Translation, Modal } from '@suite-components';
import { Account } from '@wallet-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useActions } from '@suite-hooks';
import { QrCode, QRCODE_PADDING, QRCODE_SIZE } from '@suite-components/QrCode';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-self: center;
`;

const Address = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-variant-numeric: tabular-nums slashed-zero;
    margin-bottom: 20px;
    width: 100%;
    background: ${props => props.theme.BG_LIGHT_GREY};
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 8px;
    word-break: break-all;
    padding: 10px;
    max-width: calc(${QRCODE_SIZE}px + ${QRCODE_PADDING * 2}px);
`;

const CopyButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const StyledModal = styled(Modal)`
    width: unset;
`;

interface ConfirmXpubProps {
    xpub: string;
    accountIndex: number;
    symbol: Account['symbol'];
    accountLabel: Account['metadata']['accountLabel'];
    onCancel: () => void;
}

export const ConfirmXpub = ({
    xpub,
    accountIndex,
    symbol,
    accountLabel,
    onCancel,
}: ConfirmXpubProps) => {
    // TODO: no-backup, backup failed
    // const needsBackup = device.features && device.features.needs_backup;
    const { addNotification } = useActions({
        addNotification: notificationsActions.addToast,
    });

    const htmlElement = useRef<HTMLDivElement>(null);

    const copyAddress = () => {
        const result = copyToClipboard(xpub, htmlElement.current);
        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
        }
    };

    return (
        <StyledModal
            isCancelable
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
            <Wrapper>
                <QrCode value={xpub} />
                <Address data-test="@xpub-modal/xpub-field">{xpub}</Address>
                <CopyButtonWrapper ref={htmlElement}>
                    <Button variant="tertiary" onClick={copyAddress}>
                        <Translation id="TR_XPUB_MODAL_CLIPBOARD" />
                    </Button>
                </CopyButtonWrapper>
            </Wrapper>
        </StyledModal>
    );
};
