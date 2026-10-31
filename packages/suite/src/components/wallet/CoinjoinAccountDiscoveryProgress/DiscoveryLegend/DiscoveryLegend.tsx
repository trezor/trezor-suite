import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Row, Text } from '@trezor/components';

import { LegendIcon } from './LegendIcon';
import { type DiscoveryStage } from '../PrivacyIllustration/createLoaderArt';
import { LEGEND_ITEMS } from '../discoveryCopy';

// Both legends share one grid cell, so the card keeps the taller one's height when the stage
// changes. The inactive one is hidden, which also takes it out of the accessibility tree.
const LegendCell = styled.div`
    display: grid;
    margin-top: 20px;
`;

const LegendList = styled.ul<{ $isActive: boolean }>`
    grid-area: 1 / 1;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    visibility: ${({ $isActive }) => ($isActive ? 'visible' : 'hidden')};

    svg {
        flex: none;
    }
`;

const STAGES: DiscoveryStage[] = ['block', 'mempool'];

type DiscoveryLegendProps = {
    stage: DiscoveryStage;
};

export const DiscoveryLegend = ({ stage }: DiscoveryLegendProps) => (
    <LegendCell>
        {STAGES.map(legendStage => (
            <LegendList key={legendStage} $isActive={legendStage === stage}>
                {LEGEND_ITEMS[legendStage].map(({ icon, text }) => (
                    <Row key={text} as="li" gap={10} alignItems="flex-start">
                        <LegendIcon type={icon} />
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            <Translation id={text} />
                        </Text>
                    </Row>
                ))}
            </LegendList>
        ))}
    </LegendCell>
);
