import { Translation } from 'src/components/suite';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { FormattedRelativeTime } from 'react-intl';
import { ReactNode } from 'react';
import { differenceInMinutes } from 'date-fns';

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
