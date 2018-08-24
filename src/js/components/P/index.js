import styled from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';

const Wrapper = styled.p`
`;

const P = ({ children, className }) => (
    <Wrapper className={className}>{children}</Wrapper>
);

P.propTypes = {
    className: PropTypes.string,
    children: PropTypes.string.isRequired,
};


export default P;
