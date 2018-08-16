import styled from 'styled-components';
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
    background: ${colors.GRAY_LIGHT};
    border-top: 1px solid ${colors.DIVIDER};
    border-bottom: 1px solid ${colors.DIVIDER};
`;

const Divider = ({ textLeft, textRight }) => (
    <Wrapper>
        <p>{textLeft}</p>
        <p>{textRight}</p>
    </Wrapper>
);

Divider.propTypes = {
    textLeft: PropTypes.string.isRequired,
    textRight: PropTypes.string.isRequired,
};

export default Divider;
