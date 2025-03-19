import { Banner, Card, Column, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation, WordInput } from 'src/components/suite';

export const WordInputStep = () => (
    <Card>
        <Column gap={spacings.md}>
            <Paragraph>
                <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />
            </Paragraph>
            <Banner variant="info" icon="question">
                <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
            </Banner>
            <WordInput />
        </Column>
    </Card>
);
