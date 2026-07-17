import { Row } from '@trezor/components';

import { ProgressLabel } from './ProgressLabel';
import { type ProgressLabelData } from './types';

interface ProgressLabelsProps {
    labels: ProgressLabelData[];
}

export const ProgressLabels = ({ labels }: ProgressLabelsProps) => (
    <Row data-testid="@staking/progress-labels" gap={8} alignItems="stretch" flexWrap="wrap">
        {labels.map(label => (
            <ProgressLabel
                key={label.id}
                data-testid={label['data-testid']}
                progressState={label.progressState}
            >
                {label.children}
            </ProgressLabel>
        ))}
    </Row>
);
