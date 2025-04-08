import { OnboardingOption, OptionsDivider, OptionsWrapper } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

interface SelectRecoveryTypeProps {
    onSelect: (type: 'standard' | 'advanced') => void;
}

export const SelectRecoveryType = ({ onSelect }: SelectRecoveryTypeProps) => (
    <OptionsWrapper>
        <OnboardingOption
            onClick={() => onSelect('standard')}
            icon="recoverySeedFilled"
            heading={<Translation id="TR_BASIC_RECOVERY" />}
            description={<Translation id="TR_BASIC_RECOVERY_OPTION" />}
            data-testid="@recovery/select-type/standard"
        />
        <OptionsDivider />
        <OnboardingOption
            onClick={() => onSelect('advanced')}
            icon="trezorModelOneFilled"
            heading={<Translation id="TR_ADVANCED_RECOVERY" />}
            description={<Translation id="TR_ADVANCED_RECOVERY_OPTION" />}
            data-testid="@recovery/select-type/advanced"
        />
    </OptionsWrapper>
);
