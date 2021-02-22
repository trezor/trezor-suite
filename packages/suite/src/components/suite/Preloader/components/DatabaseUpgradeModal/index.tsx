import React from 'react';
import styled from 'styled-components';
import { Modal, Image, Translation } from '@suite-components';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 20px;
`;

interface Props {
    variant: 'blocking' | 'blocked';
}

const DatabaseUpgradeModal = (props: Props) => {
    return (
        <Modal
            heading={
                <Translation
                    id={
                        props.variant === 'blocked'
                            ? 'TR_DATABASE_UPGRADE_BLOCKED'
                            : 'TR_THIS_INSTANCE_IS_BLOCKING'
                    }
                />
            }
            size="small"
            description={<Translation id="TR_RUNNING_MULTIPLE_INSTANCES" />}
        >
            <ImageWrapper>
                <Image image="DEVICE_ANOTHER_SESSION" width="250" />
            </ImageWrapper>
        </Modal>
    );
};

export default DatabaseUpgradeModal;
