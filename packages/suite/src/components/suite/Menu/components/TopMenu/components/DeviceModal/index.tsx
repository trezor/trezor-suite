import React from 'react';
import styled from 'styled-components';
import { Modal, Button } from '@trezor/components';

interface Props {
    isOpen: boolean;
    closeModal: () => void;
}

const Wrapper = styled.div`
    position: relative;
    padding: 24px;
    display: flex;
    flex-direction: column;
    text-align: center;
    width: 100%;
`;

const Title = styled.div`
    font-size: 15pt;
`;

const In = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    min-width: 400px;
`;

const DeviceMenu = (props: Props) => {
    if (!props.isOpen) return null;
    return (
        <Modal>
            <Wrapper>
                <In>
                    <Title>Switch Device</Title>
                    https://app.zeplin.io/project/5dadb7820bdfd3832e04afca/screen/5dde6fd8cbe83f201c1f35ba
                    <Button onClick={() => props.closeModal()} fullWidth>
                        Close
                    </Button>
                </In>
            </Wrapper>
        </Modal>
    );
};

export default DeviceMenu;
