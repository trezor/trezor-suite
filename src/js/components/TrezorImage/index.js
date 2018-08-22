import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.div``;

const Img = styled.img`
    width: ${props => (props.model === 'T' ? '17px' : '13px')};
`;

const TrezorImage = ({ model }) => (
    <Wrapper>
        <Img model={model} src={model === 'T' ? './images/trezor-T.png' : './images/trezor-1.png'} />
    </Wrapper>
);

TrezorImage.propTypes = {
    model: PropTypes.string,
    status: PropTypes.string,
};

export default TrezorImage;
