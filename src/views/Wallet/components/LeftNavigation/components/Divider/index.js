import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

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

const TextLeft = styled.p`
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const Divider = ({
    textLeft, textRight, hasBorder = false, className,
}) => (
    <Wrapper
        hasBorder={hasBorder}
        className={className}
    >
        <TextLeft>{textLeft}</TextLeft>
        <p>{textRight}</p>
    </Wrapper>
);

Divider.propTypes = {
    className: PropTypes.string,
    textLeft: PropTypes.string,
    textRight: PropTypes.string,
    hasBorder: PropTypes.bool,
};

export default Divider;
