import { Translation } from '@suite-native/intl';
import { prepareNativeStyle } from '@trezor/styles-native';

import { type HowEarnWorksScreenPreset } from './types';

const abbrStyle = prepareNativeStyle(({ colors }) => ({
    borderStyle: 'dotted',
    borderBottomWidth: 1,
    borderColor: colors.contentSecondary,
}));

type CreateHowYieldWorksPresetProps = {
    tokenSymbol: string;
    vaultTokenSymbol: string;
    apy: number | null;
    onApyPress: () => void;
    bonusRewardTokenSymbol?: string | null;
};

export const createHowYieldWorksPreset = ({
    tokenSymbol,
    vaultTokenSymbol,
    apy,
    onApyPress,
    bonusRewardTokenSymbol,
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
                    values={{ tokenSymbol, vaultTokenSymbol }}
                />
            ),
            description: <Translation id="earn.howYieldWorksScreen.benefits.third.description" />,
        },
        ...(bonusRewardTokenSymbol
            ? [
                  {
                      id: 'yield-benefit-bonus-reward',
                      icon: 'coin' as const,
                      title: (
                          <Translation
                              id="earn.howYieldWorksScreen.benefits.fourth.title"
                              values={{ bonusRewardTokenSymbol }}
                          />
                      ),
                      description: (
                          <Translation id="earn.howYieldWorksScreen.benefits.fourth.description" />
                      ),
                  },
              ]
            : []),
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
                        <Translation
                            id="earn.howYieldWorksScreen.depositTimeline.third.title"
                            values={{ vaultTokenSymbol }}
                        />
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
                    style: abbrStyle,
                    onPress: onApyPress,
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
        ...(bonusRewardTokenSymbol
            ? [
                  {
                      id: 'claim',
                      title: <Translation id="earn.howYieldWorksScreen.claimTimelineTitle" />,
                      iconName: 'coins' as const,
                      items: [
                          {
                              id: 'claim.first',
                              title: (
                                  <Translation id="earn.howYieldWorksScreen.claimTimeline.first.title" />
                              ),
                              description: (
                                  <Translation id="earn.howYieldWorksScreen.claimTimeline.first.description" />
                              ),
                          },
                          {
                              id: 'claim.second',
                              title: (
                                  <Translation
                                      id="earn.howYieldWorksScreen.claimTimeline.second.title"
                                      values={{ bonusRewardTokenSymbol }}
                                  />
                              ),
                              description: (
                                  <Translation id="earn.howYieldWorksScreen.claimTimeline.second.description" />
                              ),
                          },
                      ],
                  },
              ]
            : []),
    ],
});
