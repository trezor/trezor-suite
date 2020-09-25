import React from 'react';

import { P } from '@trezor/components';
import { Option, Wrapper } from '@onboarding-components';

import { WordCount } from '@recovery-types';
import { Translation } from '@suite-components';

interface Props {
    onSelect: (number: WordCount) => void;
}

const SelectWordCount = ({ onSelect }: Props) => (
    <>
        <P size="small">
            <Translation id="TR_RECOVER_SUBHEADING" />
        </P>
        <Wrapper.Options>
            <Option
                variant={3}
                action={() => {
                    onSelect(12);
                }}
                button={<Translation id="TR_WORDS" values={{ count: '12' }} />}
                imgSrc="images/svg/12-words.svg"
                data-test="@recover/select-count/12"
            />
            <Option
                variant={3}
                action={() => {
                    onSelect(18);
                }}
                button={<Translation id="TR_WORDS" values={{ count: '18' }} />}
                imgSrc="images/svg/18-words.svg"
                data-test="@recover/select-count/18"
            />
            <Option
                variant={3}
                action={() => {
                    onSelect(24);
                }}
                button={<Translation id="TR_WORDS" values={{ count: '24' }} />}
                imgSrc="images/svg/24-words.svg"
                data-test="@recover/select-count/24"
            />
        </Wrapper.Options>
    </>
);

export default SelectWordCount;
