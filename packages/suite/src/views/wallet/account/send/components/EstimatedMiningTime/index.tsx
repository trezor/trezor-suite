import { formatDuration } from '@suite-utils/date';
import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { variables, colors } from '@trezor/components-v2';

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

const CHAR = `~ `;

const EstimatedMiningTime = (props: Props) => {
    return (
        <Wrapper>
            <Translation {...messages.TR_ESTIMATED_TIME} />
            <Bold>
                {CHAR}
                {formatDuration(props.seconds)}
            </Bold>
        </Wrapper>
    );
};

export default EstimatedMiningTime;
