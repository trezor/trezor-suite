import React from 'react';
import styled from 'styled-components';
import { Modal, ModalProps } from '@trezor/components';
import { Image } from '@suite-components';

interface Props extends ModalProps {
    noBackground?: boolean;
    imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

const StyledModal = styled(Modal)`
    margin: auto;
`;

const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const Loading = ({ imageProps, ...props }: Props) => (
    <StyledModal useFixedWidth={false} {...props}>
        <LoaderWrapper data-test="@suite/loading">
            <Image width={80} height={80} image="SPINNER" {...imageProps} />
        </LoaderWrapper>
    </StyledModal>
);

export default Loading;
