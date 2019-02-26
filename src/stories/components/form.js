import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

import { AsyncSelect, Select } from 'components/Select';
import Checkbox from 'components/Checkbox';
import Input from 'components/inputs/Input';
import PinInput from 'components/inputs/Pin';
import TextArea from 'components/Textarea';

import colors from 'config/colors';

const Wrapper = styled.div`
    min-width: 250px;
`;
Wrapper.displayName = 'Wrapper';

storiesOf('Components', module)
    .addDecorator(
        withInfo({
            header: false,
            inline: true,
            maxPropsIntoLine: 1,
            styles: {
                infoStory: {
                    background: colors.LANDING,
                    borderBottom: `1px solid ${colors.DIVIDER}`,
                    padding: '30px',
                    margin: '-8px',
                },
                infoBody: {
                    border: 'none',
                    padding: '15px',
                },
            },
            excludedPropTypes: ['children'],
        }),
    )
    .addDecorator(withKnobs)
    .add('Input', () => {
        const type = select('Type', {
            Text: 'text',
            Password: 'password',
        });
        const disabled = boolean('Disabled', false);
        const value = text('Input value', '');
        const placeholder = text('Placeholder', 'placeholder...');
        const state = select('State', {
            Default: '',
            Error: 'error',
            Success: 'success',
            Warning: 'warning',
        }, '');
        const bottomText = text('Bottom text', 'bottom text');

        if (disabled) {
            return (
                <Input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    state={state}
                    bottomText={bottomText}
                    onChange={() => {}}
                    isDisabled
                />
            );
        }

        return (
            <Input
                type={type}
                value={value}
                placeholder={placeholder}
                state={state}
                bottomText={bottomText}
                onChange={() => {}}
            />
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { Input } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Input Pin', () => (
        <PinInput
            value={text('Input value', '')}
            onDeleteClick={() => {}}
        />
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { PinInput } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
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
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { TextArea } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Checkbox', () => (
        <Checkbox
            isChecked={boolean('Checked', false)}
            onClick={() => {}}
        >
            {text('Checkbox text', 'Checkbox')}
        </Checkbox>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Checkbox } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Select', () => (
        <Select
            isSearchable={boolean('Searchable', false)}
            isClearable={boolean('Clearable', false)}
            value={text('Value', 'hello')}
            options={[
                { value: 'hello', label: 'Hello' },
                { value: 'world', label: 'World' },
            ]}
        />
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Select } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Select (Async)', () => (
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
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { AsyncSelect } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
