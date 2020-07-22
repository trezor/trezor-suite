import { formatDuration } from '@suite-utils/date';
import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { variables, colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    color: ${colors.BLACK50};
`;

const Bold = styled.div`
    padding-left: 4px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

interface Props {
    seconds: number;
}

const EstimatedMiningTime = ({ seconds }: Props) => {
    return (
        <Wrapper>
            <Translation id="TR_ESTIMATED_TIME" />
            <Bold>{formatDuration(seconds)}</Bold>
        </Wrapper>
    );
};

export default EstimatedMiningTime;
