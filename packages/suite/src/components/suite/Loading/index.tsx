import React from 'react';
import styled, { css } from 'styled-components';
import { Modal, ModalProps } from '@trezor/components';
import { Image } from '@suite-components';

interface Props extends Omit<ModalProps, 'children'> {
    noBackground?: boolean;
    imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    /* width: 360px;
    height: 360px; */
`;

const StyledModal = styled(({ noBackground, ...rest }) => <Modal {...rest} />)<
    Pick<Props, 'noBackground'>
>`
    ${props =>
        props.noBackground &&
        css`
            && {
                box-shadow: none;
                background-color: transparent;
            }
        `}
`;

const Loading = ({ imageProps, noBackground, ...props }: Props) => (
    <StyledModal useFixedWidth={false} noBackground={noBackground} {...props}>
        <LoaderWrapper data-test="@suite/loading">
            <Image width={80} height={80} image="SPINNER" {...imageProps} />
        </LoaderWrapper>
    </StyledModal>
);

export default Loading;
