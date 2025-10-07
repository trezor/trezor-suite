import styled from 'styled-components';

import { Grid } from '@trezor/components';

import { OnboardingOption } from 'src/components/onboarding/OnboardingOption';
import { Translation } from 'src/components/suite/Translation';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { WordCount } from 'src/types/recovery';

const StyledOption = styled(OnboardingOption)`
    justify-content: center;
`;

type SelectWordCountProps = {
    onSelect: (number: WordCount) => void;
};

export const SelectWordCount = ({ onSelect }: SelectWordCountProps) => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Grid columns={isBelowTablet ? 1 : 3} gap={20}>
            <StyledOption
                onClick={() => {
                    onSelect(12);
                }}
                heading={<Translation id="TR_WORDS" values={{ count: '12' }} />}
                data-testid="@recovery/select-count/12"
            />
            <StyledOption
                onClick={() => {
                    onSelect(18);
                }}
                heading={<Translation id="TR_WORDS" values={{ count: '18' }} />}
                data-testid="@recovery/select-count/18"
            />
            <StyledOption
                onClick={() => {
                    onSelect(24);
                }}
                heading={<Translation id="TR_WORDS" values={{ count: '24' }} />}
                data-testid="@recovery/select-count/24"
            />
        </Grid>
    );
};
