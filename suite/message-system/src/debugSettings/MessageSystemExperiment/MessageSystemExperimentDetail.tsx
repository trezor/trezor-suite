import styled, { css } from 'styled-components';

import {
    EXPERIMENT_MAP,
    type ExperimentId,
    type ExperimentsItemType,
    buildExperimentGroupRanges,
} from '@suite-common/message-system';
import { type ExperimentsItem } from '@suite-common/suite-types';
import { InfoItem, Row, Text } from '@trezor/components';
import { LightbulbIcon, UsersThreeIcon } from '@trezor/icons';

const BarTrack = styled.div`
    flex: 1;
    display: flex;
    gap: 4px;
`;

const BarSegment = styled.div<{ $width: number; $isActive?: boolean }>`
    flex: ${({ $width }) => $width} 0 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ $isActive }) => ($isActive ? '#ffffff' : '#000000')};
    border-radius: 4px;
    background: ${({ $isActive }) => ($isActive ? '#3666BF' : '#ADCAFF')};
`;

const SegmentLabel = styled.span<{ $isActive?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 4px;

    line-height: 1;
    text-align: center;
    padding: 8px;

    ${({ $isActive }) =>
        $isActive &&
        css`
            outline: 2px dotted rgb(255 255 255 / 0.8);
            outline-offset: -4px;
            border-radius: 4px;
            width: 100%;
        `}
`;

const StyledList = styled.div`
    display: grid;
    grid-template-columns: repeat(3, max-content);
    gap: 2px 16px;

    font-variant-numeric: tabular-nums;
`;

const StyledItem = styled.div<{ $isMuted: boolean }>`
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;

    ${({ $isMuted }) =>
        $isMuted &&
        css`
            opacity: 0.5;
        `}
`;

const formatRange = (start: number, end: number) => (start === end ? '∅' : `[${start}, ${end})`);

type MessageSystemExperimentDetailProps = {
    experiment: ExperimentsItem;
    activeGroup?: ExperimentsItemType['groups'][number];
};

export const MessageSystemExperimentDetail = ({
    experiment,
    activeGroup,
}: MessageSystemExperimentDetailProps) => {
    const ranges = buildExperimentGroupRanges(experiment.groups);
    const experimentName =
        experiment.id in EXPERIMENT_MAP ? EXPERIMENT_MAP[experiment.id as ExperimentId] : undefined;

    return (
        <>
            <InfoItem
                label={experiment.id}
                typographyStyle="body-md-strong"
                icon={LightbulbIcon}
                intent="neutral"
                priority="primary"
            >
                {experimentName ? (
                    <Text>
                        <strong>Name:</strong> {experimentName ?? 'Unknown experiment'}
                    </Text>
                ) : (
                    <Text intent="warning">Unknown experiment</Text>
                )}
            </InfoItem>

            <InfoItem
                label="Groups"
                typographyStyle="body-md-strong"
                icon={UsersThreeIcon}
                intent="neutral"
                priority="primary"
            >
                <Row margin={{ vertical: 16 }}>
                    <BarTrack>
                        {ranges
                            .filter(({ range }) => range.end - range.start > 0)
                            .map(({ group, range }, index) => {
                                const isActive =
                                    group.variant === activeGroup?.variant &&
                                    group.percentage === activeGroup?.percentage;

                                return (
                                    <BarSegment
                                        key={`${group.variant}-${index}`}
                                        $width={group.percentage}
                                        title={`${group.variant}: ${group.percentage}%  ${formatRange(range.start, range.end)}`}
                                        aria-label={`${group.variant} ${group.percentage}%`}
                                        $isActive={isActive}
                                    >
                                        <SegmentLabel $isActive={isActive}>
                                            <strong>{group.variant}</strong>
                                            <span>{group.percentage}&nbsp;%</span>
                                        </SegmentLabel>
                                    </BarSegment>
                                );
                            })}
                    </BarTrack>
                </Row>

                <StyledList>
                    {ranges.map(({ group, range }, index) => (
                        <StyledItem key={index} $isMuted={group.percentage === 0}>
                            <code>{group.variant}</code>
                            <span>({group.percentage} %)</span>
                            <code>{formatRange(range.start, range.end)}</code>
                        </StyledItem>
                    ))}
                </StyledList>
            </InfoItem>
        </>
    );
};
