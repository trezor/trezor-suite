import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
`;

const Content = ({
    children,
}) => (
    <Wrapper>
        {children}
    </Wrapper>
);

Content.propTypes = {
    children: PropTypes.element,
};

export default Content;
