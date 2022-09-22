import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { DetailRow } from './DetailRow';

const Separator = styled.hr`
    border: none;
    background: ${({ theme }) => theme.STROKE_GREY};
    height: 1px;
    margin: 16px 0;
`;

interface CoinjoinSessionDetailProps {
    hours: [number, number];
    maxFee: number;
    maxRounds: number;
    skipRounds: [number, number] | null;
}

export const CoinjoinSessionDetail = ({
    hours,
    maxRounds,
    maxFee,
    skipRounds,
}: CoinjoinSessionDetailProps) => (
    <dl>
        <DetailRow
            term={<Translation id="TR_ESTIMATED_TIME" />}
            value={
                <Translation
                    id="TR_ESTIMATED_TIME_VALUE"
                    values={{ max: hours[1], min: hours[0] }}
                />
            }
        />
        <DetailRow
            term={<Translation id="TR_ROUNDS" />}
            value={<Translation id="TR_ROUNDS_VALUE" values={{ rounds: maxRounds }} />}
            tooltip="Copy needed..."
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
            tooltip="Copy needed..."
        />
        <Separator />
        <DetailRow
            term={<Translation id="TR_MAX_MINING_FEE" />}
            value={`${maxFee} sat/vB`}
            tooltip="Copy needed..."
        />
    </dl>
);
