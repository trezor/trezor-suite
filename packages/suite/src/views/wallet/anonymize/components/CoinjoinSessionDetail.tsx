import React from 'react';
import styled from 'styled-components';

import {
    ESTIMATED_HOURS_BUFFER_MODIFIER,
    ESTIMATED_ROUNDS_FAIL_RATE_BUFFER,
} from '@suite/services/coinjoin/config';
import { getEstimatedTimePerRound } from '@wallet-utils/coinjoinUtils';
import { Translation } from '@suite-components';
import { DetailRow } from './DetailRow';

const Separator = styled.hr`
    border: none;
    background: ${({ theme }) => theme.STROKE_GREY};
    height: 1px;
    margin: 16px 0;
`;

interface CoinjoinSessionDetailProps {
    maxFee: number;
    maxRounds: number;
    skipRounds?: [number, number];
}

export const CoinjoinSessionDetail = ({
    maxRounds,
    maxFee,
    skipRounds,
}: CoinjoinSessionDetailProps) => {
    const estimatedTime =
        (maxRounds / ESTIMATED_ROUNDS_FAIL_RATE_BUFFER) * getEstimatedTimePerRound(skipRounds);
    const timeBuffer = estimatedTime * ESTIMATED_HOURS_BUFFER_MODIFIER;
    const maxEstimatedTime = Math.ceil(estimatedTime + timeBuffer);
    const minEstimatedTime = Math.floor(estimatedTime - timeBuffer);
    const maxMiningFeeValue = `${maxFee} sat/vB`;

    return (
        <dl>
            <DetailRow
                term={<Translation id="TR_ESTIMATED_TIME" />}
                value={
                    <Translation
                        id="TR_ESTIMATED_TIME_VALUE"
                        values={{ max: maxEstimatedTime, min: minEstimatedTime }}
                    />
                }
            />
            <DetailRow
                term={<Translation id="TR_ROUNDS" />}
                value={<Translation id="TR_ROUNDS_VALUE" values={{ rounds: maxRounds }} />}
                tooltipMessage="TR_ROUNDS_TOOLTIP"
            />
            <DetailRow
                term={<Translation id="TR_SKIP_ROUNDS" />}
                value={
                    skipRounds ? (
                        <Translation
                            id="TR_SKIP_ROUNDS_VALUE"
                            values={{ part: skipRounds[0], total: skipRounds[1] }}
                        />
                    ) : (
                        <Translation id="TR_NONE" />
                    )
                }
                tooltipMessage="TR_SKIP_ROUNDS_TOOLTIP"
            />
            <Separator />
            <DetailRow
                term={<Translation id="TR_MAX_MINING_FEE" />}
                value={maxMiningFeeValue}
                tooltipMessage="TR_MAX_MINING_FEE_TOOLTIP"
            />
        </dl>
    );
};
