import React, { CSSProperties, useEffect, useState } from 'react';
import { createFilter } from 'react-select';
import styled, { keyframes } from 'styled-components';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import { Select, P } from '@trezor/components';
import { colors } from '@trezor/components-v2';
import { Translation } from '@suite-components';
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
    margin-top: 10px;
`;

interface Counter {
    total?: number;
    current?: number;
}
interface Props extends WrappedComponentProps {
    counter?: Counter;
    onSubmit: (word: string) => void;
}

const WordInput = (props: Props) => {
    // See styling below. Probably the only reason I need local state here is that I want to hide options
    // in case when I have focus on input but have nothing written in it. Default behaviour of React.Select
    // does not seem to support this.
    const [word, setWord] = useState('');

    const { counter, onSubmit } = props;

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
        <>
            <P>
                <Translation {...messages.TR_ENTER_SEED_WORDS_INSTRUCTION} />{' '}
                {counter && typeof counter.total === 'number' && counter.total < 24 && (
                    <Translation
                        {...messages.TR_RANDOM_SEED_WORDS_DISCLAIMER}
                        values={{ count: 24 - counter.total }}
                    />
                )}
            </P>
            <SelectWrapper>
                <Select
                    styles={{
                        option: (provided: CSSProperties, state: any) => ({
                            ...provided,
                            backgroundColor: state.isFocused
                                ? colors.GREEN
                                : provided.backgroundColor,
                            color: state.isFocused ? colors.BLACK50 : colors.BLACK17,
                            textAlign: 'initial',
                        }),
                        control: (provided: CSSProperties, state: any) => ({
                            ...provided,
                            boxShadow: `0 0 0 1px ${colors.GREEN}`,
                            '&:hover': {
                                borderColor: colors.GREEN,
                            },
                            borderColor: state.isFocused ? colors.GREEN : 'transparent',
                        }),
                        dropdownIndicator: () => ({ display: 'none' }),
                        indicatorSeparator: () => ({ display: 'none' }),
                        menu: (provided: CSSProperties) => {
                            // see here, this is why I (probably) need using local state to save word
                            if (!word) {
                                return { display: 'none' };
                            }
                            return provided;
                        },
                    }}
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
                    onInputChange={(input: string) => {
                        setWord(input || '');
                    }}
                />
            </SelectWrapper>
            {counter && typeof counter.current === 'number' && typeof counter.total === 'number' && (
                <P size="small">
                    <Translation
                        {...messages.TR_MORE_WORDS_TO_ENTER}
                        values={{ count: counter.total - counter.current }}
                    />
                </P>
            )}
        </>
    );
};

export default injectIntl(WordInput);
