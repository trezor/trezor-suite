import { Translation } from '@suite/intl';
import { Grid } from '@trezor/components';

import { OnboardingOption } from 'src/components/onboarding/OnboardingOption';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';

type SelectRecoveryTypeProps = {
    onSelect: (type: 'standard' | 'advanced') => void;
};

export const SelectRecoveryType = ({ onSelect }: SelectRecoveryTypeProps) => {
    const { isBelowTablet } = useLayoutSize();

    return (
        <Grid columns={isBelowTablet ? 1 : 2} gap={20}>
            <OnboardingOption
                onClick={() => onSelect('standard')}
                iconName="recoverySeedFilled"
                heading={<Translation id="TR_BASIC_RECOVERY" />}
                description={<Translation id="TR_BASIC_RECOVERY_OPTION" />}
                data-testid="@recovery/select-type/standard"
            />
            <OnboardingOption
                onClick={() => onSelect('advanced')}
                iconName="trezorModelOneFilled"
                heading={<Translation id="TR_ADVANCED_RECOVERY" />}
                description={<Translation id="TR_ADVANCED_RECOVERY_OPTION" />}
                data-testid="@recovery/select-type/advanced"
            />
        </Grid>
    );
};
