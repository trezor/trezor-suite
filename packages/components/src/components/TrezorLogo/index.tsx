import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Img = styled.img``;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: string;
}

const TrezorLogo = ({ type, ...rest }: Props) => {
    // $FlowIssue: `require` must be a string literal.
	const src = require(`../../images/trezor_logo_${type}_black.svg`); // eslint-disable-line
    return <Img src={src} {...rest} />;
};

TrezorLogo.propTypes = {
    type: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default TrezorLogo;
