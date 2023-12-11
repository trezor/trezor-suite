import { ReactNode } from 'react';

export type ProgressLabelState = 'stale' | 'active' | 'done';
export interface ProgressLabelData {
    id: number;
    children: ReactNode;
    progressState: ProgressLabelState;
}
