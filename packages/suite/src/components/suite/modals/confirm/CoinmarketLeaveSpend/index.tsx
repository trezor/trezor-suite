import { Button, H3 } from '@trezor/components';
import React from 'react';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import { Translation, Modal } from '@suite-components';
import styled from 'styled-components';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';

const Text = styled(H3)`
    display: flex;
    width: 100%;
    padding: 10px 0;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

export type Props = {
    onCancel: () => void;
};

export const CoinmarketLeaveSpend = ({ onCancel }: Props) => {
    const { goto, setShowLeaveModal } = useActions({
        goto: routerActions.goto,
        setShowLeaveModal: coinmarketSellActions.setShowLeaveModal,
    });

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            bottomBar={
                <>
                    <Button
                        onClick={() => {
                            onCancel();
                            setShowLeaveModal(false);
                        }}
                    >
                        <Translation id="TR_SPEND_LEAVE" />
                    </Button>
                    <Button
                        onClick={() => {
                            onCancel();
                            goto('wallet-coinmarket-spend');
                        }}
                    >
                        <Translation id="TR_SPEND_STAY" />
                    </Button>
                </>
            }
        >
            <Text>
                <Translation id="TR_SPEND_LEAVE_MODAL_INFO" />
            </Text>
        </Modal>
    );
};
