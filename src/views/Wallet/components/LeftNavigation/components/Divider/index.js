import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 28px 8px 24px;
    font-size: ${FONT_SIZE.SMALLER};
    color: ${colors.TEXT_SECONDARY};
    background: ${colors.LANDING};
    ${props => props.borderTop && css`
        border-top: 1px solid ${colors.DIVIDER};
    `}
    ${props => props.borderBottom && css`
        border-bottom: 1px solid ${colors.DIVIDER};
    `}
`;

const Divider = ({
    textLeft, textRight, borderTop = false, borderBottom = false,
}) => (
    <Wrapper
        borderTop={borderTop}
        borderBottom={borderBottom}
    >
        <p>{textLeft}</p>
        <p>{textRight}</p>
    </Wrapper>
);

Divider.propTypes = {
    textLeft: PropTypes.string,
    textRight: PropTypes.string,
    borderTop: PropTypes.bool,
    borderBottom: PropTypes.bool,
};

export default Divider;
