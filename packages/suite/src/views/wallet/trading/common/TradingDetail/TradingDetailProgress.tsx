import { type ReactNode } from 'react';

import { Box } from '@trezor/components';

import { TradingDetailHeader } from './TradingDetailHeader';
import { TradingDetailStepList } from './TradingDetailStepList';
import { type DetailHeaderMessages } from './utils';

type TradingDetailProgressProps = DetailHeaderMessages & {
    type: string;
    children: ReactNode;
};

export const TradingDetailProgress = ({
    title,
    description,
    type,
    children,
}: TradingDetailProgressProps) => (
    <>
        <TradingDetailHeader title={title} description={description} type={type} />
        <Box margin={{ top: 32, bottom: 12 }}>
            <TradingDetailStepList>{children}</TradingDetailStepList>
        </Box>
    </>
);
