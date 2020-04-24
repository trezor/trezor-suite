import React from 'react';
import styled from 'styled-components';
import { Modal, ModalProps } from '@trezor/components';
import { Image } from '@suite-components';

const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    /* width: 360px;
    height: 360px; */
`;

interface Props extends Omit<ModalProps, 'children'> {
    imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

const Loading = ({ imageProps, ...props }: Props) => (
    <Modal useFixedWidth={false} {...props}>
        <LoaderWrapper data-test="@suite/loading">
            <Image width={80} height={80} image="SPINNER" {...imageProps} />
        </LoaderWrapper>
    </Modal>
);

export default Loading;
