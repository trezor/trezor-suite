import styled from 'styled-components';

import { OnboardingOption, OptionsDivider, OptionsWrapper } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { WordCount } from 'src/types/recovery';

const StyledOption = styled(OnboardingOption)`
    justify-content: center;
`;

interface SelectWordCountProps {
    onSelect: (number: WordCount) => void;
}

export const SelectWordCount = ({ onSelect }: SelectWordCountProps) => (
    <OptionsWrapper>
        <StyledOption
            onClick={() => {
                onSelect(12);
            }}
            heading={<Translation id="TR_WORDS" values={{ count: '12' }} />}
            data-testid="@recover/select-count/12"
        />
        <OptionsDivider />
        <StyledOption
            onClick={() => {
                onSelect(18);
            }}
            heading={<Translation id="TR_WORDS" values={{ count: '18' }} />}
            data-testid="@recover/select-count/18"
        />
        <OptionsDivider />
        <StyledOption
            onClick={() => {
                onSelect(24);
            }}
            heading={<Translation id="TR_WORDS" values={{ count: '24' }} />}
            data-testid="@recover/select-count/24"
        />
    </OptionsWrapper>
);
