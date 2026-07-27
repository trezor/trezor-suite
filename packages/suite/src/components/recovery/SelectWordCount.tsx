import { Translation } from '@suite/intl';
import { type WordCount } from '@suite/recovery';
import { Grid } from '@trezor/components';

import { OnboardingOption } from 'src/components/onboarding/OnboardingOption';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type SelectWordCountProps = {
    onSelect: (number: WordCount) => void;
};

export const SelectWordCount = ({ onSelect }: SelectWordCountProps) => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Grid columns={isBelowTablet ? 1 : 3} gap={20}>
            <OnboardingOption
                onClick={() => {
                    onSelect(12);
                }}
                heading={<Translation id="TR_WORDS" values={{ count: '12' }} />}
                data-testid="@recovery/select-count/12"
            />
            <OnboardingOption
                onClick={() => {
                    onSelect(18);
                }}
                heading={<Translation id="TR_WORDS" values={{ count: '18' }} />}
                data-testid="@recovery/select-count/18"
            />
            <OnboardingOption
                onClick={() => {
                    onSelect(24);
                }}
                heading={<Translation id="TR_WORDS" values={{ count: '24' }} />}
                data-testid="@recovery/select-count/24"
            />
        </Grid>
    );
};
