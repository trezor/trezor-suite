import React, { useEffect } from 'react';
import { createFilter } from 'react-select';
import styled, { keyframes } from 'styled-components';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import { Select } from '@trezor/components';
import { BIP_39 } from '@suite-constants';
import messages from '@suite/support/messages';

const options = BIP_39.map(item => ({ label: item, value: item }));

const shake = keyframes`
    10%, 90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%, 80% {
        transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
        transform: translate3d(4px, 0, 0);
    }
`;

const SelectWrapper = styled.div`
    animation: ${shake} 1.3s;
    margin: 12px auto;
    width: 380px;
    text-align: left;
`;

// interface Counter {
//     total?: number;
//     current?: number;
// }
interface Props extends WrappedComponentProps {
    onSubmit: (word: string) => void;
}

const WordInput = (props: Props) => {
    const { onSubmit } = props;

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            // 13 enter, 9 tab
            if (event.keyCode === 13 || event.keyCode === 9) {
                return onSubmit;
            }
        };
        window.addEventListener('keydown', keyboardHandler, false);
        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [onSubmit]);

    return (
        <SelectWrapper>
            <Select
                autoFocus
                isSearchable
                isClearable={false}
                controlShouldRenderValue={false}
                noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                    `word "${inputValue}" does not exist in words list`
                }
                onChange={(item: any) => {
                    onSubmit(item.value);
                }}
                placeholder={props.intl.formatMessage(messages.TR_CHECK_YOUR_DEVICE)}
                options={options}
                filterOption={createFilter({
                    ignoreCase: true,
                    trim: true,
                    matchFrom: 'start',
                })}
            />
        </SelectWrapper>
    );
};

export default injectIntl(WordInput);
