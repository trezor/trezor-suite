import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Img = styled.img<Props>``;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    model: number;
}

const TrezorImage = ({ model, ...rest }: Props) => {
    // $FlowIssue: `require` must be a string literal.
	const src = require(`../../images/trezor-${model}.png`); // eslint-disable-line
    return <Img model={model} src={src} {...rest} />;
};

TrezorImage.propTypes = {
    model: PropTypes.oneOf([1, 2]),
};

export { TrezorImage, Props as TrezorImageProps };
