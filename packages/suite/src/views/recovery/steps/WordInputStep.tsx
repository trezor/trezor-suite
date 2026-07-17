import { Translation } from '@suite/intl';
import { Banner, Card, Column, Paragraph } from '@trezor/components';
import { QuestionIcon } from '@trezor/icons';

import { WordInput } from 'src/components/suite';

export const WordInputStep = () => (
    <Card>
        <Column gap={16}>
            <Paragraph>
                <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />
            </Paragraph>
            <Banner
                intent="info"
                icon={QuestionIcon}
                description={<Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />}
            />
            <WordInput />
        </Column>
    </Card>
);
