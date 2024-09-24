import { Translation } from 'src/components/suite/Translation';
import { Card, CollapsibleBox, Column, H3, List } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { EstimatedGains } from './EstimatedGains';
import { StakingInfo } from 'src/components/suite/StakingProcess/StakingInfo';

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
        <Column alignItems="stretch" gap={spacings.lg} height="fit-content">
            {cards.map((card, index) => (
                <Card key={index} paddingType="small">
                    <CollapsibleBox
                        heading={<H3 typographyStyle="highlight">{card.heading}</H3>}
                        fillType="none"
                        paddingType="none"
                        hasDivider={false}
                        defaultIsOpen={card.defaultIsOpen}
                    >
                        <List isOrdered bulletGap={spacings.sm} gap={spacings.md}>
                            {card.content}
                        </List>
                    </CollapsibleBox>
                </Card>
            ))}
        </Column>
    );
};
