import styled from 'styled-components';

import { OnboardingOption, OptionsWrapper, OptionsDivider } from 'src/components/onboarding';
import { WordCount } from 'src/types/recovery';
import { Translation } from 'src/components/suite';

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
            data-test-id="@recover/select-count/12"
        />
        <OptionsDivider />
        <StyledOption
            onClick={() => {
                onSelect(18);
            }}
            heading={<Translation id="TR_WORDS" values={{ count: '18' }} />}
            data-test-id="@recover/select-count/18"
        />
        <OptionsDivider />
        <StyledOption
            onClick={() => {
                onSelect(24);
            }}
            heading={<Translation id="TR_WORDS" values={{ count: '24' }} />}
            data-test-id="@recover/select-count/24"
        />
    </OptionsWrapper>
);
