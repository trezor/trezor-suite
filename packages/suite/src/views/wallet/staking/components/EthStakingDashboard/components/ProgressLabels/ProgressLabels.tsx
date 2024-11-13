import { spacings } from '@trezor/theme';
import { Row } from '@trezor/components';

import { ProgressLabelData } from './types';
import { ProgressLabel } from './ProgressLabel';

interface ProgressLabelsProps {
    labels: ProgressLabelData[];
}

export const ProgressLabels = ({ labels }: ProgressLabelsProps) => (
    <Row gap={spacings.xs} alignItems="stretch" flexWrap="wrap">
        {labels.map(label => (
            <ProgressLabel key={label.id} progressState={label.progressState}>
                {label.children}
            </ProgressLabel>
        ))}
    </Row>
);
