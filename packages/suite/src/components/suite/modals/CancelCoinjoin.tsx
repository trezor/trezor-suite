import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { useSelector } from '@suite-hooks/useSelector';
import { Modal, Translation } from '..';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';
import { useDispatch } from 'react-redux';
import { stopCoinjoinSession } from '@wallet-actions/coinjoinAccountActions';

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
    const account = useSelector(selectSelectedAccount);

    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

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
                    <StyledButton
                        variant="danger"
                        onClick={() => {
                            dispatch(stopCoinjoinSession(account.key));
                            onClose();
                        }}
                    >
                        <Translation id="TR_CANCEL_COINJOIN_YES" />
                    </StyledButton>
                </>
            }
        >
            <Translation id="TR_CANCEL_COINJOIN_QUESTION" />
        </StyledModal>
    );
};
