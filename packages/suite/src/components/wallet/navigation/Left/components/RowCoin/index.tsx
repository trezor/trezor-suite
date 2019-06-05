import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { CoinLogo, Icon, colors, variables } from '@trezor/components';
import Row from '../Row';

const CoinNameWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const CoinLogoWrapper = styled.div`
    padding-right: 20px;
    width: 40px;
    display: flex;
    justify-content: center;
`;

const RowCoinWrapper = styled.div`
    padding: ${variables.LEFT_NAVIGATION_ROW.PADDING};
    padding-top: 0;
    padding-bottom: 0;
    height: 44px;
    display: block;
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
    transition: background-color 0.3s, color 0.3s;

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;

const Left = styled.div`
    display: flex;
    padding-top: 1px;
    justify-content: space-between;
    align-items: center;
`;

const IconWrapper = styled.div`
    margin-right: 10px;
`;

const RowCoin = ({ network, iconLeft, iconRight }) => (
    <RowCoinWrapper>
        <Row>
            <Left>
                {iconLeft && (
                    <IconWrapper>
                        <Icon icon={iconLeft.type} size={iconLeft.size} color={iconLeft.color} />
                    </IconWrapper>
                )}
                <CoinNameWrapper>
                    <CoinLogoWrapper>
                        <CoinLogo height="23" network={network.shortcut} />
                    </CoinLogoWrapper>
                    <p>{network.name}</p>
                </CoinNameWrapper>
            </Left>
            {iconRight && (
                <Icon icon={iconRight.type} size={iconRight.size} color={iconRight.color} />
            )}
        </Row>
    </RowCoinWrapper>
);

const iconShape = {
    type: PropTypes.object.isRequired,
    color: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
};
RowCoin.propTypes = {
    network: PropTypes.shape({
        name: PropTypes.string.isRequired,
        shortcut: PropTypes.string,
    }).isRequired,
    iconLeft: PropTypes.shape(iconShape),
    iconRight: PropTypes.shape(iconShape),
};

export default RowCoin;
