import React from 'react';

import { AccordionItem, Box, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type FAQ = {
    question: string;
    answer: string;
};

const faqMap: FAQ[] = [
    {
        question: 'What is a public key (XPUB)?',
        answer: 'A public key (XPUB) is a string of characters derived from a private key. It can be shared without compromising the security of the private key, allowing others to send crypto to your wallet without being able to access your funds. In Trezor Suite Lite, you can find your XPUB by going to the "Receive" tab and selecting the appropriate account.',
    },
    {
        question: 'How do I receive crypto in Trezor Suite Lite?',
        answer: 'To receive crypto in Trezor Suite Lite, go to the "Receive" tab and select the appropriate account. You will then see a QR code and a string of characters representing your public key (XPUB). Share this information with the person sending you crypto, and they will be able to send it to your wallet.',
    },
    {
        question: 'Why shouldn’t I receive a large amount?',
        answer: "Receiving a large amount of cryptocurrency in one transaction can attract unwanted attention and may increase the risk of theft. It's generally recommended to receive smaller amounts or to break up larger transactions into smaller ones. Additionally, receiving large amounts may trigger anti-money laundering (AML) and know-your-customer (KYC) regulations, which can be time-consuming and burdensome.",
    },
    {
        question: 'Why don’t I see my coin listed?',
        answer: 'Trezor Suite Lite currently supports a limited number of cryptocurrencies. If your coin is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins, so you may want to check back periodically to see if your coin has been added.',
    },
    {
        question: 'What does the graph display?',
        answer: 'The graph in Trezor Suite Lite displays the price history of the selected cryptocurrency over a specified time period. You can adjust the time period by selecting a different range on the bottom of the graph. This feature can help you track the performance of your holdings and make informed decisions about buying, selling, or holding your coins.',
    },
];

const accordionItemStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.medium,
    borderBottomWidth: 1,
    borderBottomColor: utils.colors.borderOnElevation0,
}));

export const FAQInfoPanel = () => {
    const { applyStyle } = useNativeStyles();
    return (
        <VStack>
            {faqMap.map(({ question, answer }) => (
                <Box key={question} style={applyStyle(accordionItemStyle)}>
                    <AccordionItem title={question} content={answer} />
                </Box>
            ))}
        </VStack>
    );
};
