import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import Icon from 'components/common/Icon';
import colors from 'config/colors';
import { FONT_SIZE, TRANSITION_TIME } from 'config/variables';

import { coinProp } from './common';
import CoinLogo from './CoinLogo';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 16px 24px;

    cursor: pointer;
    font-size: ${FONT_SIZE.BASE};

    transition: background-color ${TRANSITION_TIME.BASE}, color ${TRANSITION_TIME.BASE};

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;

const CoinLink = ({ coin, iconRight }) => (
    <Wrapper>
        <CoinLogo
            coinImg={coin.img}
            text={coin.name}
        />
        {iconRight ? (
            <Icon
                icon={iconRight.type}
                color={iconRight.color}
            />
        ) : null}
    </Wrapper>
);

CoinLink.propTypes = {
    ...coinProp,
    iconRight: PropTypes.shape({
        type: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    }),
};

export default CoinLink;
