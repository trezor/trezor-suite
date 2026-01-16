import { Translation } from '@suite/intl';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { CollapsibleBox, Column, H3 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { StakingInfo } from 'src/components/suite/StakingProcess/StakingInfo';

import { EstimatedGains } from './EstimatedGains';

interface StakeInfoCardsProps {
    flow: StakingFlow;
}

export const StakeInfoCards = ({ flow }: StakeInfoCardsProps) => {
    const cards = [
        {
            heading: <Translation id="TR_STAKING_ONCE_YOU_CONFIRM" />,
            content: <StakingInfo isExpanded flow={flow} />,
            defaultIsOpen: true,
        },
        {
            heading: <Translation id="TR_STAKING_ESTIMATED_GAINS" />,
            content: <EstimatedGains />,
            defaultIsOpen: false,
        },
    ];

    return (
        <Column gap={spacings.lg} margin={{ bottom: spacings.lg }}>
            {cards.map((card, index) => (
                <CollapsibleBox
                    heading={<H3 typographyStyle="highlight">{card.heading}</H3>}
                    key={index}
                    hasDivider={false}
                    defaultIsOpen={card.defaultIsOpen}
                >
                    {card.content}
                </CollapsibleBox>
            ))}
        </Column>
    );
};
