import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Row, Tooltip } from '@trezor/components';

const Abbr = styled.abbr`
    cursor: help;
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

interface EarnRateProps {
    rate: number | null;
    type: 'apy' | 'apr';
    children: ReactNode;
}

export const EarnRate = ({ rate, type, children }: EarnRateProps) => {
    if (!rate) {
        return children;
    }

    return (
        <Row gap={4}>
            {children}
            <Tooltip
                content={<Translation id={type === 'apy' ? 'TR_STAKE_APY' : 'TR_STAKE_APR'} />}
            >
                <Abbr>
                    <Translation id={type === 'apy' ? 'TR_EARN_APY' : 'TR_EARN_APR'} />
                </Abbr>
            </Tooltip>
        </Row>
    );
};
