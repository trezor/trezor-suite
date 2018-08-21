import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import { getStatusColor } from 'utils/device';

const Wrapper = styled.div`
    width: 20px;
    position: relative;
`;

const Dot = styled.div`
    border: 2px solid ${colors.WHITE};
    border-radius: 50%;
    position: absolute;
    background: ${props => props.color};
    top: -5px;
    right: 0px;
    width: 10px;
    height: 10px;
`;

const Img = styled.img`
    width: ${props => (props.model === 'T' ? '17px' : '13px')};
`;

const TrezorImage = ({ model, status }) => (
    <Wrapper>
        {status && <Dot color={getStatusColor(status)} />}
        <Img
            model={model}
            src={model === 'T' ? './images/trezor-T.png' : './images/trezor-1.png'}
        />
    </Wrapper>
);

TrezorImage.propTypes = {
    model: PropTypes.string,
    status: PropTypes.string,
};

export default TrezorImage;
