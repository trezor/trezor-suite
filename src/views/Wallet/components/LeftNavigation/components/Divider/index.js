import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 28px 8px 24px;
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    background: ${colors.LANDING};
    ${props => props.hasBorder && css`
        border-top: 1px solid ${colors.BODY};
        border-bottom: 1px solid ${colors.BODY};
    `}
`;

const Divider = ({
    textLeft, textRight, hasBorder = false,
}) => (
    <Wrapper
        hasBorder={hasBorder}
    >
        <p>{textLeft}</p>
        <p>{textRight}</p>
    </Wrapper>
);

Divider.propTypes = {
    textLeft: PropTypes.string,
    textRight: PropTypes.string,
    hasBorder: PropTypes.bool,
};

export default Divider;
