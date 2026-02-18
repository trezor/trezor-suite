import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { CollapsibleBox, Column, H3 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { EarnSupplyingInfo } from 'src/components/earn';
import { useSelector } from 'src/hooks/suite';

import { EstimatedGains } from './EstimatedGains';

interface StakeInfoCardsProps {
    account: Account;
    flow: EarnFlow;
}

export const StakeInfoCards = ({ account, flow }: StakeInfoCardsProps) => {
    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const cards = [
        {
            heading: <Translation id="TR_STAKING_ONCE_YOU_CONFIRM" />,
            content: <EarnSupplyingInfo isExpanded flow={flow} />,
            defaultIsOpen: true,
            isVisible: true,
        },
        {
            heading: <Translation id="TR_STAKING_ESTIMATED_GAINS" />,
            content: <EstimatedGains />,
            defaultIsOpen: false,
            isVisible: apy !== null,
        },
    ];

    return (
        <Column gap={spacings.lg} margin={{ bottom: spacings.lg }}>
            {cards
                .filter(card => card.isVisible)
                .map((card, index) => (
                    <CollapsibleBox
                        heading={<H3 typographyStyle="body-md-strong">{card.heading}</H3>}
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
