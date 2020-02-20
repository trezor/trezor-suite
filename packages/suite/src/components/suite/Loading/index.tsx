import React from 'react';
import styled from 'styled-components';
import ModalWrapper, { Props as ModalWrapperProps } from '@suite-components/ModalWrapper';
import { resolveStaticPath } from '@suite-utils/nextjs';

const LoaderWrapper = styled(ModalWrapper)`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    /* width: 360px;
    height: 400px; */
`;
const Image = styled.img``;

interface Props extends ModalWrapperProps {
    imageProps?: React.HTMLAttributes<HTMLImageElement>;
}

const Loading = (props: Props) => (
    <LoaderWrapper {...props} data-test="@suite/loading">
        <Image src={resolveStaticPath(`images/suite/spinner.svg`)} {...props.imageProps} />
    </LoaderWrapper>
);

export default Loading;
