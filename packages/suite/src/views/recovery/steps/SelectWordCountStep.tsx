import { Translation } from '@suite/intl';
import { type WordCount, wordCounts } from '@suite/recovery';
import { Card, Column, Grid, H4, Paragraph, RadioCard } from '@trezor/components';
type SelectWordCountStepProps = {
    setWordCount: (number: WordCount) => void;
    wordCount?: WordCount;
};

export const SelectWordCountStep = ({ setWordCount, wordCount }: SelectWordCountStepProps) => (
    <Card margin={{ top: 8 }}>
        <Column gap={16}>
            <H4>
                <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
            </H4>
            <Grid columns={3} gap={16}>
                {wordCounts.map(count => (
                    <RadioCard
                        key={count}
                        isSelected={wordCount === count}
                        onClick={() => setWordCount(count)}
                        dataTestId={`@recovery/select-count/${count}`}
                    >
                        <Paragraph align="center" typographyStyle="body-md-strong">
                            <Translation id="TR_WORDS" values={{ count }} />
                        </Paragraph>
                    </RadioCard>
                ))}
            </Grid>
        </Column>
    </Card>
);
