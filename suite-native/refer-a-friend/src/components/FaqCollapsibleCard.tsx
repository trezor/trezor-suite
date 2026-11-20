import { AccordionItemText, AccordionList, CollapsibleCard } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { LeaveProgramLink } from './LeaveProgramLink';
import type { ProgramProps } from '../hooks/useReferAFriend';

type FaqCollapsibleCardProps = {
    program: ProgramProps;
    isProgramActive?: boolean;
};

export const FaqCollapsibleCard = ({ program, isProgramActive }: FaqCollapsibleCardProps) => (
    <CollapsibleCard
        title={<Translation id="referAFriend.faq.title" />}
        isCollapsed={isProgramActive}
    >
        <AccordionList
            items={[
                {
                    title: <Translation id="referAFriend.faq.whatIsRaf.question" />,
                    content: (
                        <AccordionItemText>
                            <Translation id="referAFriend.faq.whatIsRaf.answer" values={program} />
                        </AccordionItemText>
                    ),
                },
                ...(!isProgramActive
                    ? [
                          {
                              title: <Translation id="referAFriend.faq.howToJoin.question" />,
                              content: (
                                  <AccordionItemText>
                                      <Translation id="referAFriend.faq.howToJoin.answer" />
                                  </AccordionItemText>
                              ),
                          },
                      ]
                    : []),
                {
                    title: <Translation id="referAFriend.faq.limits.question" />,
                    content: (
                        <AccordionItemText>
                            <Translation id="referAFriend.faq.limits.answer" values={program} />
                        </AccordionItemText>
                    ),
                },
                {
                    title: <Translation id="referAFriend.faq.howToUse.question" values={program} />,
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
                            values={program}
                        />
                    ),
                    content: (
                        <AccordionItemText>
                            <Translation
                                id="referAFriend.faq.otherPromotions.answer"
                                values={program}
                            />
                        </AccordionItemText>
                    ),
                },
                {
                    title: <Translation id="referAFriend.faq.notWorking.question" />,
                    content: (
                        <AccordionItemText>
                            <Translation id="referAFriend.faq.notWorking.answer" values={program} />
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
                ...(isProgramActive
                    ? [
                          {
                              title: <Translation id="referAFriend.faq.howToLeave.question" />,
                              content: (
                                  <AccordionItemText>
                                      <Translation
                                          id="referAFriend.faq.howToLeave.answer"
                                          values={{
                                              leaveProgram: chunks => (
                                                  <LeaveProgramLink label={chunks} />
                                              ),
                                          }}
                                      />
                                  </AccordionItemText>
                              ),
                          },
                      ]
                    : []),
            ]}
        />
    </CollapsibleCard>
);
