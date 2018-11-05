import React from 'react';
import colors from 'config/colors';
import ICONS from 'config/icons';
import Icon from 'components/Icon';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
`;

const Tooltip = () => (
    <Wrapper>
        <Icon
            icon={ICONS.T1}
            color={colors.WHITE}
        />
        Check address on your Trezor
    </Wrapper>
);

export default Tooltip;
