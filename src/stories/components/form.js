import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

import { AsyncSelect, Select } from 'components/Select';
import Checkbox from 'components/Checkbox';
import Input from 'components/inputs/Input';
import TextArea from 'components/Textarea';

const Wrapper = styled.div`
    min-width: 250px;
`;
Wrapper.displayName = 'Wrapper';

storiesOf('Form', module)
    .addDecorator(
        withInfo({
            header: true,
            excludedPropTypes: ['children'],
        }),
    )
    .addDecorator(centered)
    .addDecorator(withKnobs)
    .add('Input', () => (
        <Input
            type={select('Type', {
                Text: 'text',
                Password: 'password',
            })}
            isDisabled={boolean('Disabled', false)}
            value={text('Input value', '')}
            placeholder={text('Placeholder', 'placeholder...')}
            state={select('State', {
                Default: '',
                Error: 'error',
                Success: 'success',
                Warning: 'warning',
            }, '')}
            bottomText={text('Bottom text', 'bottom text')}
            onChange={() => {}}
        />
    ))
    .add('Textarea', () => (
        <TextArea
            isDisabled={boolean('Disabled', false)}
            value={text('Value', '')}
            placeholder={text('Placeholder', 'placeholder...')}
            state={select('State', {
                Default: '',
                Error: 'error',
                Success: 'success',
                Warning: 'warning',
            }, '')}
            bottomText={text('Bottom text', 'bottom text')}
        />
    ))
    .add('Checkbox', () => (
        <Checkbox
            isChecked={boolean('Checked', false)}
            onClick={() => {}}
        >
            {text('Checkbox text', 'Checkbox')}
        </Checkbox>
    ))
    .add('Select', () => (
        <Wrapper>
            <Select
                isSearchable={boolean('Searchable', false)}
                isClearable={boolean('Clearable', false)}
                value={text('Value', 'hello')}
                options={[
                    { value: 'hello', label: 'Hello' },
                    { value: 'world', label: 'World' },
                ]}
            />
        </Wrapper>
    ))
    .add('Select (Async)', () => (
        <Wrapper>
            <AsyncSelect
                defaultOptions={[
                    { value: 'hello', label: 'Hello' },
                    { value: 'world', label: 'World' },
                ]}
                cacheOptions={false}
                onInputChange={() => {}}
                loadOptions={(inputValue, callback) => {
                    const data = [
                        { value: 'hello', label: 'Hello' },
                        { value: 'world', label: 'World' },
                    ].filter(item => item.label.toLowerCase().search(inputValue.toLowerCase()) !== -1);
                    callback(data);
                }}
            />
        </Wrapper>
    ));
