import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ProgressLabel } from './ProgressLabel';
import { ProgressLabelData } from './types';

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
