import { ReactNode } from 'react';

import { BulletList } from '@trezor/components';

type YieldFlowStepListProps = {
    children: ReactNode;
};

export const YieldFlowStepList = ({ children }: YieldFlowStepListProps) => (
    <BulletList bulletSize="small" bulletGap={12} gap={24} titleGap={16}>
        {children}
    </BulletList>
);
