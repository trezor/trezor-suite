import { Translation } from '@suite-native/intl';

import { type HowEarnWorksScreenPreset } from './types';

type CreateHowYieldWorksPresetProps = {
    tokenSymbol: string;
    vaultTokenName: string;
    apy: number | null;
};

export const createHowYieldWorksPreset = ({
    tokenSymbol,
    vaultTokenName,
    apy,
}: CreateHowYieldWorksPresetProps): HowEarnWorksScreenPreset => ({
    benefitItems: [
        {
            id: 'yield-benefit-lock',
            icon: 'lock',
            title: (
                <Translation
                    id="earn.howYieldWorksScreen.benefits.first.title"
                    values={{ tokenSymbol }}
                />
            ),
            description: <Translation id="earn.howYieldWorksScreen.benefits.first.description" />,
        },
        {
            id: 'yield-benefit-rewards',
            icon: 'trendUp',
            title: <Translation id="earn.howYieldWorksScreen.benefits.second.title" />,
            description: <Translation id="earn.howYieldWorksScreen.benefits.second.description" />,
        },
        {
            id: 'yield-benefit-representation',
            icon: 'coins',
            title: (
                <Translation
                    id="earn.howYieldWorksScreen.benefits.third.title"
                    values={{ tokenSymbol, vaultTokenName }}
                />
            ),
            description: (
                <Translation
                    id="earn.howYieldWorksScreen.benefits.third.description"
                    values={{ vaultTokenName }}
                />
            ),
        },
    ],
    timelineSections: [
        {
            id: 'supply',
            title: <Translation id="earn.howYieldWorksScreen.supplyTimelineTitle" />,
            iconName: 'arrowUpRight',
            items: [
                {
                    id: 'supply.first',
                    title: <Translation id="earn.howYieldWorksScreen.supplyTimeline.first.title" />,
                    description: (
                        <Translation id="earn.howYieldWorksScreen.supplyTimeline.first.description" />
                    ),
                },
                {
                    id: 'supply.second',
                    title: (
                        <Translation id="earn.howYieldWorksScreen.supplyTimeline.second.title" />
                    ),
                    description: (
                        <Translation id="earn.howYieldWorksScreen.supplyTimeline.second.description" />
                    ),
                },
                {
                    id: 'supply.third',
                    title: <Translation id="earn.howYieldWorksScreen.supplyTimeline.third.title" />,
                    description:
                        apy !== null ? (
                            <Translation
                                id="earn.howYieldWorksScreen.supplyTimeline.third.description"
                                values={{ apy }}
                            />
                        ) : (
                            <Translation id="earn.notAvailableShort" />
                        ),
                },
            ],
        },
        {
            id: 'withdraw',
            title: <Translation id="earn.howYieldWorksScreen.withdrawTimelineTitle" />,
            iconName: 'arrowDownLeft',
            items: [
                {
                    id: 'withdraw.first',
                    title: (
                        <Translation id="earn.howYieldWorksScreen.withdrawTimeline.first.title" />
                    ),
                    description: (
                        <Translation id="earn.howYieldWorksScreen.withdrawTimeline.first.description" />
                    ),
                },
                {
                    id: 'withdraw.second',
                    title: (
                        <Translation
                            id="earn.howYieldWorksScreen.withdrawTimeline.second.title"
                            values={{ tokenSymbol }}
                        />
                    ),
                    description: (
                        <Translation id="earn.howYieldWorksScreen.withdrawTimeline.second.description" />
                    ),
                },
            ],
        },
    ],
});
