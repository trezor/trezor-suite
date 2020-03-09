import React from 'react';
import styled from 'styled-components';
import ModalWrapper, { Props as ModalWrapperProps } from '@suite-components/ModalWrapper';
import { Image } from '@suite-components';

const LoaderWrapper = styled(ModalWrapper)`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    /* width: 360px;
    height: 400px; */
`;

interface Props extends ModalWrapperProps {
    imageProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

const Loading = (props: Props) => (
    <LoaderWrapper {...props} data-test="@suite/loading">
        <Image width={80} height={80} image="SPINNER" {...props.imageProps} />
    </LoaderWrapper>
);

export default Loading;
