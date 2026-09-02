import { useMemo } from 'react';

import { Translation } from '@suite-native/intl';

import { type HowEarnWorksBenefitItem } from './HowEarnWorksBenefitsSection';
import { type HowEarnWorksScreenPreset, type HowEarnWorksTimelineSectionPreset } from './types';
import { ApyDottedUnderline } from '../ApyDottedUnderline';

type UseHowYieldWorksPresetProps = {
    tokenSymbol: string;
    vaultTokenSymbol: string;
    apy: number | null;
    onApyPress: () => void;
    bonusRewardTokenSymbol?: string | null;
    wrappedNativeSymbol: string | null;
};

export const useHowYieldWorksPreset = ({
    tokenSymbol,
    vaultTokenSymbol,
    apy,
    onApyPress,
    bonusRewardTokenSymbol,
    wrappedNativeSymbol,
}: UseHowYieldWorksPresetProps): HowEarnWorksScreenPreset => {
    const benefitItems: HowEarnWorksBenefitItem[] = useMemo(() => {
        if (wrappedNativeSymbol !== null) {
            return [
                {
                    id: 'yield-benefit-lock',
                    icon: 'coins',
                    title: (
                        <Translation
                            id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.first.title"
                            values={{ nativeSymbol: wrappedNativeSymbol }}
                        />
                    ),
                    description: (
                        <Translation
                            id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.first.description"
                            values={{ nativeSymbol: wrappedNativeSymbol }}
                        />
                    ),
                },
                {
                    id: 'yield-benefit-rewards',
                    icon: 'coins',
                    title: (
                        <Translation
                            id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.second.title"
                            values={{ nativeSymbol: wrappedNativeSymbol, vaultTokenSymbol }}
                        />
                    ),
                    description: (
                        <Translation id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.second.description" />
                    ),
                },
                {
                    id: 'yield-benefit-representation',
                    icon: 'lock',
                    title: (
                        <Translation
                            id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.third.title"
                            values={{ vaultTokenSymbol }}
                        />
                    ),
                    description: (
                        <Translation
                            id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.third.description"
                            values={{ nativeSymbol: wrappedNativeSymbol }}
                        />
                    ),
                },
                ...(bonusRewardTokenSymbol
                    ? [
                          {
                              id: 'yield-benefit-bonus-reward',
                              icon: 'coins' as const,
                              title: (
                                  <Translation
                                      id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.fourth.title"
                                      values={{ bonusRewardTokenSymbol }}
                                  />
                              ),
                              description: (
                                  <Translation id="earn.howYieldWorksScreen.benefits.wrappedNativeVault.fourth.description" />
                              ),
                          },
                      ]
                    : []),
            ];
        }

        return [
            {
                id: 'yield-benefit-lock',
                icon: 'lock',
                title: (
                    <Translation
                        id="earn.howYieldWorksScreen.benefits.first.title"
                        values={{ tokenSymbol }}
                    />
                ),
                description: (
                    <Translation id="earn.howYieldWorksScreen.benefits.first.description" />
                ),
            },
            {
                id: 'yield-benefit-rewards',
                icon: 'trendUp',
                title: <Translation id="earn.howYieldWorksScreen.benefits.second.title" />,
                description: (
                    <Translation id="earn.howYieldWorksScreen.benefits.second.description" />
                ),
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
                description: (
                    <Translation id="earn.howYieldWorksScreen.benefits.third.description" />
                ),
            },
            ...(bonusRewardTokenSymbol
                ? [
                      {
                          id: 'yield-benefit-bonus-reward',
                          icon: 'coin' as const,
                          title: (
                              <Translation
                                  id="earn.howYieldWorksScreen.benefits.fourth.title"
                                  values={{ bonusRewardTokenName: bonusRewardTokenSymbol }}
                              />
                          ),
                          description: (
                              <Translation id="earn.howYieldWorksScreen.benefits.fourth.description" />
                          ),
                      },
                  ]
                : []),
        ];
    }, [wrappedNativeSymbol, tokenSymbol, vaultTokenSymbol, bonusRewardTokenSymbol]);

    const timelineSections: HowEarnWorksTimelineSectionPreset[] = useMemo(
        () => [
            {
                id: 'deposit',
                title: <Translation id="earn.howYieldWorksScreen.depositTimelineTitle" />,
                iconName: 'arrowUpRight',
                items: [
                    ...(wrappedNativeSymbol !== null
                        ? [
                              {
                                  id: 'deposit.wrap',
                                  title: (
                                      <Translation
                                          id="earn.howYieldWorksScreen.depositTimeline.wrap.title"
                                          values={{
                                              nativeSymbol: wrappedNativeSymbol,
                                              tokenSymbol,
                                          }}
                                      />
                                  ),
                                  description: (
                                      <Translation id="earn.howYieldWorksScreen.depositTimeline.wrap.description" />
                                  ),
                              },
                          ]
                        : []),
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
                        descriptionContainer: ({ children }) => (
                            <ApyDottedUnderline onPress={onApyPress}>{children}</ApyDottedUnderline>
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
                    ...(wrappedNativeSymbol !== null
                        ? [
                              {
                                  id: 'withdraw.unwrap',
                                  title: (
                                      <Translation
                                          id="earn.howYieldWorksScreen.withdrawTimeline.unwrap.title"
                                          values={{
                                              nativeSymbol: wrappedNativeSymbol,
                                              tokenSymbol,
                                          }}
                                      />
                                  ),
                                  description: (
                                      <Translation id="earn.howYieldWorksScreen.withdrawTimeline.unwrap.description" />
                                  ),
                              },
                          ]
                        : []),
                    {
                        id: 'withdraw.second',
                        title: (
                            <Translation
                                id="earn.howYieldWorksScreen.withdrawTimeline.second.title"
                                values={{
                                    tokenSymbol: wrappedNativeSymbol ?? tokenSymbol,
                                }}
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
        [
            wrappedNativeSymbol,
            tokenSymbol,
            vaultTokenSymbol,
            apy,
            onApyPress,
            bonusRewardTokenSymbol,
        ],
    );

    return {
        benefitItems,
        timelineSections,
    };
};
