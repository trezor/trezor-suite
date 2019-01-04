/* @flow */

import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

type Props = {
    model: string;
}

const Wrapper = styled.div``;

const Img = styled.img`
    width: ${props => (props.model === 'T' ? '17px' : '13px')};
`;

const TrezorImage = ({ model }: Props) => {
    // $FlowIssue: `require` must be a string literal.
    const src = require(`./images/trezor-${model}.png`); // eslint-disable-line
    return (
        <Wrapper>
            <Img model={model} src={src} />
        </Wrapper>
    );
};

TrezorImage.propTypes = {
    model: PropTypes.string,
};

export default TrezorImage;
