import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Accordion, Card, Text, Button } from '@suite-native/atoms';

type FAQ = {
    question: string;
    answer: string;
};

const faqMap: FAQ[] = [
    { question: 'What is XPUB', answer: 'Lorem ipsum' },
    { question: 'What the graph displays?', answer: 'Lorem ipsum' },
    {
        question: 'What is input / output?',
        answer: 'TextLayoutEvent object is returned in the callback as a result of a component layout change. It contains a key called lines with a value which is an array containing TextLayout object corresponded to every rendered text line.',
    },
    { question: 'What is unverified address?', answer: 'Lorem ipsum' },
    { question: 'How to verify address?', answer: 'Lorem ipsum' },
];

export const SettingsFAQ = () => (
    <Screen header={<ScreenHeader title="FAQ" />}>
        <VStack spacing="medium">
            <VStack>
                {faqMap.map(({ question, answer }) => (
                    <Accordion key={question} title={question} content={answer} />
                ))}
            </VStack>
            <Card>
                <VStack spacing="medium">
                    <Text numberOfLines={3} variant="titleSmall">
                        Need more help?
                    </Text>
                    <Button>Contact support</Button>
                </VStack>
            </Card>
        </VStack>
    </Screen>
);
