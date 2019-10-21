import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import styled, { keyframes } from 'styled-components';
import { createFilter } from 'react-select';
import { injectIntl, WrappedComponentProps, FormattedMessage } from 'react-intl';

import { Select, P } from '@trezor/components';

import colors from '@onboarding-config/colors';

import bip39List from '@onboarding-constants/bip39';

import { Text } from '@onboarding-components';

// todo move messages here
import l10nMessages from './WordsInput.messages';

const sortedBip39 = bip39List.map(item => ({ label: item, value: item }));

// todo: if agreed on, refactor to animations.
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
    min-width: 400px;
    animation: ${shake} 1.3s;
    margin-top: 10px;
`;

interface Props extends WrappedComponentProps {
    wordsCount: number;
    counter?: number;
    onSubmit: (word: string) => void;
}

// type AnyWord = typeof bip39List[number];

const WordsInput = (props: Props) => {
    const [word, setWord] = useState('');

    const { wordsCount, counter, onSubmit } = props;

    const checkWord = (word?: string) => {
        return typeof word === 'string' && bip39List.includes(word);
    };

    const submit = useCallback(
        (directWord?: string) => {
            if (directWord) {
                onSubmit(directWord);
            } else if (checkWord(word)) {
                onSubmit(word);
            }
            setWord('');
        },
        [word, onSubmit],
    );

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            // 13 enter, 9 tab
            if (event.keyCode === 13 || event.keyCode === 9) {
                submit();
            }
        };
        window.addEventListener('keydown', keyboardHandler, false);
        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [submit]);

    return (
        <>
            <Text>
                <FormattedMessage {...l10nMessages.TR_ENTER_SEED_WORDS_INSTRUCTION} />{' '}
                {wordsCount < 24 && (
                    <FormattedMessage
                        {...l10nMessages.TR_RANDOM_SEED_WORDS_DISCLAIMER}
                        values={{ count: 24 - wordsCount }}
                    />
                )}
            </Text>
            <SelectWrapper>
                <Select
                    styles={{
                        option: (provided: CSSProperties, state: any) => ({
                            ...provided,
                            backgroundColor: state.isFocused
                                ? colors.brandPrimary
                                : provided.backgroundColor,
                            color: state.isFocused ? colors.grayLight : colors.grayDark,
                            textAlign: 'initial',
                        }),
                        control: (provided: CSSProperties, state: any) => ({
                            ...provided,
                            boxShadow: `0 0 0 1px ${colors.brandPrimary}`,
                            '&:hover': {
                                borderColor: colors.brandPrimary,
                            },
                            borderColor: state.isFocused ? colors.brandPrimary : 'transparent',
                        }),
                        dropdownIndicator: () => ({ display: 'none' }),
                        indicatorSeparator: () => ({ display: 'none' }),
                        menu: (provided: CSSProperties) => {
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
                        submit(item.value);
                    }}
                    placeholder={props.intl.formatMessage(l10nMessages.TR_CHECK_YOUR_DEVICE)}
                    options={sortedBip39}
                    filterOption={createFilter({
                        ignoreCase: true,
                        trim: true,
                        matchFrom: 'start',
                    })}
                    onInputChange={(input: string) => {
                        if (input) {
                            setWord(input);
                        }
                    }}
                />
            </SelectWrapper>
            {typeof counter === 'number' && counter >= 1 && (
                <P size="small">
                    <FormattedMessage
                        {...l10nMessages.TR_MORE_WORDS_TO_ENTER}
                        values={{ count: 24 - counter }}
                    />
                </P>
            )}
        </>
    );
};

export default injectIntl(WordsInput);
