import { FormattedRelativeTime } from 'react-intl';
import { ReactNode } from 'react';

import styled from 'styled-components';
import { differenceInMinutes } from 'date-fns';

import { Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';

const LastUpdate = styled.div`
    text-transform: none;
`;

interface LastUpdateTooltipProps {
    timestamp: number;
    children: ReactNode;
}

export const LastUpdateTooltip = ({ timestamp, children }: LastUpdateTooltipProps) => {
    const rateAge = (timestamp: number) => differenceInMinutes(new Date(timestamp), new Date());

    return (
        <Tooltip
            maxWidth={285}
            placement="top"
            content={
                <LastUpdate>
                    <Translation
                        id="TR_LAST_UPDATE"
                        values={{
                            value: (
                                <FormattedRelativeTime
                                    value={rateAge(timestamp) * 60}
                                    numeric="auto"
                                    updateIntervalInSeconds={10}
                                />
                            ),
                        }}
                    />
                </LastUpdate>
            }
        >
            {children}
        </Tooltip>
    );
};
