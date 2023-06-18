import React from 'react';

import { Option, OptionsWrapper, OptionsDivider } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

interface SelectRecoveryTypeProps {
    onSelect: (type: 'standard' | 'advanced') => void;
}

export const SelectRecoveryType = ({ onSelect }: SelectRecoveryTypeProps) => (
    <OptionsWrapper>
        <Option
            onClick={() => onSelect('standard')}
            icon="SEED_SINGLE"
            heading={<Translation id="TR_BASIC_RECOVERY" />}
            description={<Translation id="TR_BASIC_RECOVERY_OPTION" />}
            data-test="@recover/select-type/basic"
        />
        <OptionsDivider />
        <Option
            onClick={() => onSelect('advanced')}
            icon="SEED_SHAMIR"
            heading={<Translation id="TR_ADVANCED_RECOVERY" />}
            description={<Translation id="TR_ADVANCED_RECOVERY_OPTION" />}
            data-test="@recover/select-type/advanced"
        />
    </OptionsWrapper>
);
