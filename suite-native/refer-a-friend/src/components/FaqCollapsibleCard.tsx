import { AccordionItemText, AccordionList, CollapsibleCard } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';

import { useReferAFriend } from '../hooks/useReferAFriend';

export const FaqCollapsibleCard = () => {
    // TODO: pass as props?
    const {
        rewardAmount,
        minimumOrderAmount,
        friendDiscountPercentage,
        annualReferralLimit,
        annualRewardLimit,
    } = useReferAFriend();

    return (
        <CollapsibleCard title={<Translation id="referAFriend.faq.title" />}>
            <AccordionList
                items={[
                    {
                        title: <Translation id="referAFriend.faq.whatIsRaf.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation
                                    id="referAFriend.faq.whatIsRaf.answer"
                                    values={{
                                        rewardAmount,
                                        minimumOrderAmount,
                                        friendDiscountPercentage,
                                        annualReferralLimit,
                                        annualRewardLimit,
                                    }}
                                />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: <Translation id="referAFriend.faq.howToJoin.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation id="referAFriend.faq.howToJoin.answer" />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: <Translation id="referAFriend.faq.limits.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation
                                    id="referAFriend.faq.limits.answer"
                                    values={{
                                        annualReferralLimit,
                                        annualRewardLimit,
                                        friendDiscountPercentage,
                                    }}
                                />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: (
                            <Translation
                                id="referAFriend.faq.howToUse.question"
                                values={{ rewardAmount }}
                            />
                        ),
                        content: (
                            <AccordionItemText>
                                <Translation id="referAFriend.faq.howToUse.answer" />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: (
                            <Translation
                                id="referAFriend.faq.otherPromotions.question"
                                values={{ friendDiscountPercentage }}
                            />
                        ),
                        content: (
                            <AccordionItemText>
                                <Translation
                                    id="referAFriend.faq.otherPromotions.answer"
                                    values={{ friendDiscountPercentage }}
                                />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: <Translation id="referAFriend.faq.notWorking.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation
                                    id="referAFriend.faq.notWorking.answer"
                                    values={{
                                        annualReferralLimit,
                                        rewardAmount,
                                    }}
                                />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: <Translation id="referAFriend.faq.oldRaf.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation id="referAFriend.faq.oldRaf.answer" />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: <Translation id="referAFriend.faq.multipleDevices.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation id="referAFriend.faq.multipleDevices.answer" />
                            </AccordionItemText>
                        ),
                    },
                    {
                        title: <Translation id="referAFriend.faq.howToLeave.question" />,
                        content: (
                            <AccordionItemText>
                                <Translation
                                    id="referAFriend.faq.howToLeave.answer"
                                    values={{
                                        leaveProgram: chunks => (
                                            <Link
                                                onPress={() => {}}
                                                label={chunks}
                                                textVariant="body-sm"
                                                textColor="contentPrimary"
                                                isUnderlined
                                            />
                                        ),
                                    }}
                                />
                            </AccordionItemText>
                        ),
                    },
                ]}
            />
        </CollapsibleCard>
    );
};
