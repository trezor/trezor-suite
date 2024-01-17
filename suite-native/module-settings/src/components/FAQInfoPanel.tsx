import { Fragment } from 'react';
import { FlatList } from 'react-native';

import { AccordionItem, Box, Text, VStack } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { useTranslate } from '@suite-native/intl';

type BulletListProps = {
    texts: string[];
};

const BulletList = ({ texts }: BulletListProps) => {
    const data = texts.map(text => ({ key: text }));
    return (
        <FlatList
            data={data}
            renderItem={({ item }) => (
                <Box flexDirection="row">
                    <Text variant="label"> • </Text>
                    <Text variant="label">{item.key}</Text>
                </Box>
            )}
        />
    );
};

type QuestionItemProps = {
    question: string;
    answer: string | string[];
};

const QuestionItem = ({ question, answer }: QuestionItemProps) => {
    const txt = typeof answer === 'string' ? answer : <BulletList texts={answer} />;
    return (
        <Fragment key={question}>
            <AccordionItem title={question} content={txt} />
        </Fragment>
    );
};

const EnabledUsbFAQ = () => {
    const { translate } = useTranslate();
    return (
        <>
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.0.question')}
                answer={translate('moduleSettings.faq.usbEnabled.0.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.1.question')}
                answer={translate('moduleSettings.faq.usbEnabled.1.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.2.question')}
                answer={translate('moduleSettings.faq.usbEnabled.2.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.3.question')}
                answer={[
                    translate('moduleSettings.faq.usbEnabled.3.answer.0'),
                    translate('moduleSettings.faq.usbEnabled.3.answer.1'),
                    translate('moduleSettings.faq.usbEnabled.3.answer.2'),
                    translate('moduleSettings.faq.usbEnabled.3.answer.3'),
                ]}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.4.question')}
                answer={[
                    translate('moduleSettings.faq.usbEnabled.4.answer.0'),
                    translate('moduleSettings.faq.usbEnabled.4.answer.1'),
                    translate('moduleSettings.faq.usbEnabled.4.answer.2'),
                ]}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.5.question')}
                answer={translate('moduleSettings.faq.usbEnabled.5.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.6.question')}
                answer={translate('moduleSettings.faq.usbEnabled.6.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbEnabled.7.question')}
                answer={translate('moduleSettings.faq.usbEnabled.7.answer')}
            />
        </>
    );
};

const DisabledUsbFAQ = () => {
    const { translate } = useTranslate();
    return (
        <>
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.0.question')}
                answer={translate('moduleSettings.faq.usbDisabled.0.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.1.question')}
                answer={translate('moduleSettings.faq.usbDisabled.1.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.2.question')}
                answer={translate('moduleSettings.faq.usbDisabled.2.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.3.question')}
                answer={translate('moduleSettings.faq.usbDisabled.3.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.4.question')}
                answer={translate('moduleSettings.faq.usbDisabled.4.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.5.question')}
                answer={translate('moduleSettings.faq.usbDisabled.5.answer')}
            />
            <QuestionItem
                question={translate('moduleSettings.faq.usbDisabled.6.question')}
                answer={translate('moduleSettings.faq.usbDisabled.6.answer')}
            />
        </>
    );
};

export const FAQInfoPanel = () => {
    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    return (
        <VStack marginHorizontal="medium">
            {isUsbDeviceConnectFeatureEnabled ? <EnabledUsbFAQ /> : <DisabledUsbFAQ />}
        </VStack>
    );
};
