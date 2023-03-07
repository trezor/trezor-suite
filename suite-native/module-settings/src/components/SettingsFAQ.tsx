import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Accordion, Card, Text, Button } from '@suite-native/atoms';

type FAQ = {
    question: string;
    answer: string;
};

const faqMap: FAQ[] = [
    { question: 'What is XPUB', answer: 'Lorem ipsum' },
    { question: 'What the graph displays?', answer: '' },
    { question: 'What is input / output?', answer: '' },
    { question: 'What is unverified address?', answer: '' },
    { question: 'How to verify address?', answer: '' },
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
                    <Text variant="titleSmall">Need more help?</Text>
                    <Button>Contact support</Button>
                </VStack>
            </Card>
        </VStack>
    </Screen>
);
