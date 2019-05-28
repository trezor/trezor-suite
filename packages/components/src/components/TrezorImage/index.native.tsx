import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

const models = {
    // eslint-disable-next-line global-require
    1: require('../../images/trezor-1.png'),
    // eslint-disable-next-line global-require
    2: require('../../images/trezor-2.png'),
};

const Img = styled.Image``;

interface Props {
    model: number;
}

const TrezorImage = ({ model, ...rest }: Props) => {
    return <Img source={models[1]} {...rest} />;
};

TrezorImage.propTypes = {
    model: PropTypes.oneOf([1, 2]),
};

export default TrezorImage;
