import { Banner, Card, Column, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { WordInput } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

export const WordInputStep = () => (
    <Card>
        <Column gap={spacings.md}>
            <Paragraph>
                <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />
            </Paragraph>
            <Banner intent="info" icon="question">
                <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
            </Banner>
            <WordInput />
        </Column>
    </Card>
);
