import { type ReactNode } from 'react';

import { Column, Text } from '@trezor/components';

import { ChartFrame } from './ChartFrame';

type ChartNoteProps = {
    children: ReactNode;
    'data-testid': string;
};

export const ChartNote = ({ children, 'data-testid': dataTestId }: ChartNoteProps) => (
    <ChartFrame data-testid={dataTestId}>
        <Column height="100%" justifyContent="center" alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {children}
            </Text>
        </Column>
    </ChartFrame>
);
