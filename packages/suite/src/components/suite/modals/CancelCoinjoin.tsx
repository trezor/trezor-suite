import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { useSelector } from 'src/hooks/suite/useSelector';
import { Modal, Translation } from '..';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useDispatch } from 'src/hooks/suite';
import { stopCoinjoinSession } from 'src/actions/wallet/coinjoinClientActions';

const StyledModal = styled(Modal)`
    width: 435px;
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
