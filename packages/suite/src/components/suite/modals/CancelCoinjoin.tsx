import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { useActions } from '@suite-hooks/useActions';
import * as coinjoinAccountActions from '@wallet-actions/coinjoinAccountActions';
import { useSelector } from '@suite-hooks/useSelector';
import { Modal, Translation } from '..';

const StyledModal = styled(Modal)`
    width: 430px;
`;

const StyledButton = styled(Button)`
    flex: 1;
`;

const CancelButton = styled(StyledButton)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    background: ${({ theme }) => theme.BG_WHITE_ALT_HOVER};

    :hover {
        background: ${({ theme }) => theme.STROKE_GREY};
    }
`;

interface CancelCoinjoinProps {
    onClose: () => void;
}

export const CancelCoinjoin = ({ onClose }: CancelCoinjoinProps) => {
    const { account } = useSelector(state => state.wallet.selectedAccount) as SelectedAccountLoaded;

    const { stopCoinjoinSession } = useActions({
        stopCoinjoinSession: coinjoinAccountActions.stopCoinjoinSession,
    });

    return (
        <StyledModal
            isCancelable
            onCancel={onClose}
            heading={<Translation id="TR_CANCEL_COINJOIN" />}
            bottomBar={
                <>
                    <CancelButton variant="secondary" onClick={onClose}>
                        <Translation id="TR_CANCEL_COINJOIN_NO" />
                    </CancelButton>
                    <StyledButton variant="danger" onClick={() => stopCoinjoinSession(account)}>
                        <Translation id="TR_CANCEL_COINJOIN_YES" />
                    </StyledButton>
                </>
            }
        >
            <Translation id="TR_CANCEL_COINJOIN_QUESTION" />
        </StyledModal>
    );
};
