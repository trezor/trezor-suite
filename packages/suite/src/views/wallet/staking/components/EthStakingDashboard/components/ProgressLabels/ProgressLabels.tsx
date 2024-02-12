import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { ProgressLabelData } from './types';
import { ProgressLabel } from './ProgressLabel';

const ProgressLabelsList = styled.div`
    display: flex;
    flex-wrap: wrap;
    row-gap: ${spacingsPx.xs};

    & > div {
        flex: 1 0 220px;
    }
`;

interface ProgressLabelsProps {
    labels: ProgressLabelData[];
}

export const ProgressLabels = ({ labels }: ProgressLabelsProps) => (
    <ProgressLabelsList>
        {labels.map(label => (
            <ProgressLabel key={label.id} progressState={label.progressState}>
                {label.children}
            </ProgressLabel>
        ))}
    </ProgressLabelsList>
);
