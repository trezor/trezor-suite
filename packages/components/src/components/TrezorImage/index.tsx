import React from 'react';
import styled from 'styled-components';

const Img = styled.img<Props>``;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    model: number;
}

const TrezorImage = ({ model, ...rest }: Props) => {
    // $FlowIssue: `require` must be a string literal.
    const src = require(`../../images/trezor-${model}.png`); // eslint-disable-line
    return <Img model={model} src={src} {...rest} />;
};

export { TrezorImage, Props as TrezorImageProps };
