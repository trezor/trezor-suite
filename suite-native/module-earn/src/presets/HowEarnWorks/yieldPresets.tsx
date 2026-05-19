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
            id: 'deposit',
            title: <Translation id="earn.howYieldWorksScreen.depositTimelineTitle" />,
            iconName: 'arrowUpRight',
            items: [
                {
                    id: 'deposit.first',
                    title: (
                        <Translation id="earn.howYieldWorksScreen.depositTimeline.first.title" />
                    ),
                    description: (
                        <Translation id="earn.howYieldWorksScreen.depositTimeline.first.description" />
                    ),
                },
                {
                    id: 'deposit.second',
                    title: (
                        <Translation id="earn.howYieldWorksScreen.depositTimeline.second.title" />
                    ),
                    description: (
                        <Translation id="earn.howYieldWorksScreen.depositTimeline.second.description" />
                    ),
                },
                {
                    id: 'deposit.third',
                    title: (
                        <Translation id="earn.howYieldWorksScreen.depositTimeline.third.title" />
                    ),
                    description:
                        apy !== null ? (
                            <Translation
                                id="earn.howYieldWorksScreen.depositTimeline.third.description"
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
