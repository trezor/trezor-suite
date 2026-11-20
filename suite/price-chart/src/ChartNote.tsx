import { type ReactNode } from 'react';

import { Column, Text } from '@trezor/components';

import { ChartFrame } from './ChartFrame';

type ChartNoteProps = {
    children: ReactNode;
    action?: ReactNode;
    'data-testid': string;
};

export const ChartNote = ({ children, action, 'data-testid': dataTestId }: ChartNoteProps) => (
    <ChartFrame data-testid={dataTestId}>
        <Column height="100%" justifyContent="center" alignItems="center" gap={12}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {children}
            </Text>
            {action}
        </Column>
    </ChartFrame>
);
