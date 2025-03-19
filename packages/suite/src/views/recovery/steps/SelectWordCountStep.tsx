import { Card, Column, Grid, H4, Paragraph, RadioCard } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { WordCount, wordCounts } from 'src/types/recovery';

type SelectWordCountStepProps = {
    setWordCount: (number: WordCount) => void;
    wordCount?: WordCount;
};

export const SelectWordCountStep = ({ setWordCount, wordCount }: SelectWordCountStepProps) => (
    <Card margin={{ top: spacings.xs }}>
        <Column gap={spacings.md}>
            <H4>
                <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
            </H4>
            <Grid columns={3} gap={spacings.md}>
                {wordCounts.map(count => (
                    <RadioCard
                        key={count}
                        isActive={wordCount === count}
                        onClick={() => setWordCount(count)}
                        dataTestId={`@recovery/select-count/${count}`}
                    >
                        <Paragraph align="center" typographyStyle="highlight">
                            <Translation id="TR_WORDS" values={{ count }} />
                        </Paragraph>
                    </RadioCard>
                ))}
            </Grid>
        </Column>
    </Card>
);
