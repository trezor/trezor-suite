import React from 'react';
import styled from 'styled-components';

import { P, variables } from '@trezor/components-v2';
import { Option } from '@onboarding-components';
import messages from '@suite/support/messages';
import { WordCount } from '@recovery-types';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    margin-top: 35px;

    @media (min-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: row;
    }
`;

interface Props {
    onSelect: (number: WordCount) => void;
}

const SelectWordCount = ({ onSelect }: Props) => (
    <>
        <P size="small">
            <Translation {...messages.TR_RECOVER_SUBHEADING} />
        </P>
        <Wrapper>
            <Option
                variant={3}
                action={() => {
                    onSelect(12);
                }}
                button={<Translation {...messages.TR_WORDS} values={{ count: '12' }} />}
                imgSrc="images/recovery/12-words.svg"
            />
            <Option
                variant={3}
                action={() => {
                    onSelect(18);
                }}
                button={<Translation {...messages.TR_WORDS} values={{ count: '18' }} />}
                imgSrc="images/recovery/18-words.svg"
            />
            <Option
                variant={3}
                action={() => {
                    onSelect(24);
                }}
                button={<Translation {...messages.TR_WORDS} values={{ count: '24' }} />}
                imgSrc="images/recovery/24-words.svg"
            />
        </Wrapper>
    </>
);

export default SelectWordCount;
