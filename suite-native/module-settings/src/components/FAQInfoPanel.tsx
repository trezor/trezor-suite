import { Fragment, ReactNode } from 'react';

import { AccordionItem, Text, VStack } from '@suite-native/atoms';
import { Link } from '@suite-native/link';

type FAQ = {
    question: string;
    answer: ReactNode;
};

const faqMap: FAQ[] = [
    {
        question: 'What is a public key (XPUB) or a receive address?',
        answer: 'An XPUB is a master public key for hierarchical deterministic wallets like bitcoin, generating multiple child keys and receive addresses for improved privacy. Ethereum uses a single, unchanging address for all transactions. Sharing your XPUB is discouraged as it reveals all bitcoin addresses and transactions. For Ethereum, share only your address, while keeping your private key secure.',
    },
    {
        question: 'How do I send crypto in Trezor Suite Lite?',
        answer: (
            <Text variant="label">
                Trezor Suite Lite is a watch-only portfolio tracker, which means it is designed to
                help you monitor your cryptocurrency holdings and transactions. Unfortunately, it is
                not currently possible to send crypto using Trezor Suite Lite. To send crypto, use
                the full version of{' '}
                <Link
                    href="https://trezor.io/learn/a/get-to-know-the-trezor-suite-app"
                    label="Trezor Suite"
                />{' '}
                with your Trezor hardware wallet. This will provide you with the necessary security
                and functionality to manage and perform transactions with your cryptocurrencies.
            </Text>
        ),
    },
    {
        question: 'Why don’t I see my coin listed?',
        answer: 'Trezor Suite Lite currently supports a limited number of cryptocurrencies. If your coin is not listed, it may not be compatible with the app. However, Trezor regularly adds support for new coins, so check back periodically to see which coins have been added.',
    },
    {
        question: 'What does the graph display?',
        answer: 'The graph in Trezor Suite Lite displays the price history of your portfolio’s synced assets over a specified time period. You can adjust the time period by selecting a different range on the bottom of the graph.',
    },
    {
        question:
            'Why is the balance displayed in Trezor Suite different from the balance displayed in Trezor Suite Lite?',
        answer: 'Balances may mismatch due to improper syncing of all assets and account types, or pending transactions. Ensure you have synced all your assets correctly and check for any pending transactions to resolve the discrepancy.',
    },
];

export const FAQInfoPanel = () => (
    <VStack marginHorizontal="m">
        {faqMap.map(({ question, answer }) => (
            <Fragment key={question}>
                <AccordionItem title={question} content={answer} />
            </Fragment>
        ))}
    </VStack>
);
