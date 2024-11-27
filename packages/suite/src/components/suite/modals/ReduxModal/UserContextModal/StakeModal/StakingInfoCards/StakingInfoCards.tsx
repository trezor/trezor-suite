import { CollapsibleBox, Column, H3, List } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { StakingInfo } from 'src/components/suite/StakingProcess/StakingInfo';

import { EstimatedGains } from './EstimatedGains';

export const StakingInfoCards = () => {
    const cards = [
        {
            heading: <Translation id="TR_STAKING_ONCE_YOU_CONFIRM" />,
            content: <StakingInfo isExpanded />,
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
                    <List isOrdered bulletGap={spacings.sm} gap={spacings.md}>
                        {card.content}
                    </List>
                </CollapsibleBox>
            ))}
        </Column>
    );
};
