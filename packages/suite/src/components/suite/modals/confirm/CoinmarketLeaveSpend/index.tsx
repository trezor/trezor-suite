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
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const LeftButton = styled(Button)`
    margin-right: 20px;
`;

const Content = styled.div`
    display: flex;
    padding: 40px;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const Buttons = styled.div`
    display: flex;
    margin: 20px;
`;

export type Props = {
    onCancel: () => void;
};

const CoinmarketLeaveSpend = ({ onCancel }: Props) => {
    const { goto, setShowLeaveModal } = useActions({
        goto: routerActions.goto,
        setShowLeaveModal: coinmarketSellActions.setShowLeaveModal,
    });

    return (
        <Modal cancelable onCancel={onCancel} noPadding>
            <Content>
                <Text>
                    <Translation id="TR_SPEND_LEAVE_MODAL_INFO" />
                </Text>
                <Buttons>
                    <LeftButton
                        onClick={() => {
                            onCancel();
                            setShowLeaveModal(false);
                        }}
                    >
                        <Translation id="TR_SPEND_LEAVE" />
                    </LeftButton>
                    <Button
                        onClick={() => {
                            onCancel();
                            goto('wallet-coinmarket-spend');
                        }}
                    >
                        <Translation id="TR_SPEND_STAY" />
                    </Button>
                </Buttons>
            </Content>
        </Modal>
    );
};

export default CoinmarketLeaveSpend;
