import React from 'react';

import { P, Link } from '@trezor/components';
import { Option, Wrapper } from '@onboarding-components';

import { Translation } from '@suite-components';
import { URLS } from '@suite-constants';

interface Props {
    onSelect: (number: boolean) => void;
}

const SelectRecoveryType = ({ onSelect }: Props) => (
    <>
        <P size="small">
            <Translation
                id="TR_RECOVERY_TYPES_DESCRIPTION"
                values={{
                    TR_LEARN_MORE: (
                        <Link size="small" href={URLS.RECOVERY_MODEL_ONE_URL}>
                            <Translation id="TR_LEARN_MORE" />
                        </Link>
                    ),
                }}
            />
        </P>
        <Wrapper.Options>
            <Option
                action={() => {
                    onSelect(false);
                }}
                title={<Translation id="TR_BASIC_RECOVERY" />}
                text={<Translation id="TR_BASIC_RECOVERY_OPTION" />}
                button={<Translation id="TR_BASIC_RECOVERY" />}
                imgSrc="images/svg/recovery-basic.svg"
                data-test="@recover/select-type/basic"
            />

            <Option
                action={() => {
                    onSelect(true);
                }}
                title={<Translation id="TR_ADVANCED_RECOVERY" />}
                text={<Translation id="TR_ADVANCED_RECOVERY_OPTION" />}
                button={<Translation id="TR_ADVANCED_RECOVERY" />}
                imgSrc="images/svg/recovery-advanced.svg"
                data-test="@recover/select-type/advanced"
            />
        </Wrapper.Options>
    </>
);

export default SelectRecoveryType;
