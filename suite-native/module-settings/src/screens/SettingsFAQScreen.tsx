import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack, Accordion, Card, Text, Button, handleRedirect, Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

const accordionItemStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.medium,
    borderBottomWidth: 1,
    borderBottomColor: utils.colors.borderOnElevation0,
}));

export const SettingsFAQScreen = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <Screen header={<ScreenHeader title="Get help" />}>
            <VStack spacing="large">
                <VStack>
                    {faqMap.map(({ question, answer }) => (
                        <Box key={question} style={applyStyle(accordionItemStyle)}>
                            <Accordion title={question} content={answer} />
                        </Box>
                    ))}
                </VStack>
                <Card>
                    <VStack spacing="medium">
                        <Text numberOfLines={3} variant="titleSmall">
                            Need more help?
                        </Text>
                        <Button onPress={() => handleRedirect('https://trezor.io/support')}>
                            Contact support
                        </Button>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
