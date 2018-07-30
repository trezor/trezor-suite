// @flow

import styled, { css } from 'styled-components';
import colors from '~/js/config/colors';

const baseStyles = css`
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    color: ${colors.black};
    font-weight: bold;
`;

const H1 = styled.h1`
  ${baseStyles}
  font-size: 16px;
`;

const H2 = styled.h2`
  ${baseStyles};
  font-size: 14px;
`;

const H3 = styled.h3`
  ${baseStyles};
  font-size: 12px;
`;

const H4 = styled.h4`
  ${baseStyles};
  font-size: 10px;
`;

const Heading = {
    H1,
    H2,
    H3,
    H4,
};

module.exports = Heading;