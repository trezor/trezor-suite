import React from 'react';
import { NeueOption, OptionsWrapper, OptionsDivider } from '@onboarding-components';
import { Translation } from '@suite-components';

interface Props {
    onSelect: (number: boolean) => void;
}

const SelectRecoveryType = ({ onSelect }: Props) => (
    <>
        {/* <P size="small">
            <Translation
                id="TR_RECOVERY_TYPES_DESCRIPTION"
                values={{
                    TR_LEARN_MORE: (
                        <TrezorLink size="small" href={URLS.RECOVERY_MODEL_ONE_URL}>
                            <Translation id="TR_LEARN_MORE" />
                        </TrezorLink>
                    ),
                }}
            />
        </P> */}
        <OptionsWrapper>
            <NeueOption
                onClick={() => {
                    onSelect(false);
                }}
                icon="SEED_SINGLE"
                heading={<Translation id="TR_BASIC_RECOVERY" />}
                description={<Translation id="TR_BASIC_RECOVERY_OPTION" />}
                data-test="@recover/select-type/basic"
            />
            <OptionsDivider />
            <NeueOption
                onClick={() => {
                    onSelect(true);
                }}
                icon="SEED_SHAMIR"
                heading={<Translation id="TR_ADVANCED_RECOVERY" />}
                description={<Translation id="TR_ADVANCED_RECOVERY_OPTION" />}
                data-test="@recover/select-type/advanced"
            />
        </OptionsWrapper>
    </>
);

export default SelectRecoveryType;
