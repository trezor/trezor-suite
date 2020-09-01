import { formatDuration } from '@suite-utils/date';
import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { variables, colors } from '@trezor/components';

const Wrapper = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Duration = styled.span`
    padding-left: 4px;
`;

interface Props {
    seconds: number;
}

const EstimatedMiningTime = ({ seconds }: Props) => {
    return (
        <Wrapper>
            <Translation id="ESTIMATED_TIME" />
            <Duration>{formatDuration(seconds)}</Duration>
        </Wrapper>
    );
};

export default EstimatedMiningTime;
