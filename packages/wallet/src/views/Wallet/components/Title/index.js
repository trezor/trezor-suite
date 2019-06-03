/* @flow */
import * as React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors } from 'trezor-ui-components';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

type OwnProps = {|
    children?: React.Node,
|};

const Wrapper = styled.div`
    font-size: ${FONT_SIZE.WALLET_TITLE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${colors.WALLET_TITLE};
    padding-bottom: 35px;
`;

const Title = ({ children }: OwnProps) => <Wrapper>{children}</Wrapper>;

Title.propTypes = {
    children: PropTypes.node,
};

export default Title;
