import React from 'react';

import { storiesOf } from '@storybook/react';

import Input from 'components/inputs/Input';
import TextArea from 'components/Textarea';
import Checkbox from 'components/Checkbox';
import { Select, AsyncSelect } from 'components/Select';

const loadOptions = (inputValue, callback) => {
    const data = [
        { value: 'hello', label: 'Hello' },
        { value: 'world', label: 'World' },
    ].filter(item => item.label.toLowerCase().search(inputValue.toLowerCase()) !== -1);
    callback(data);
};

storiesOf('Form', module)
    .addWithJSX('Input', () => (
        <Input
            placeholder="placeholder..."
            value="Input value"
            onChange={() => {}}
        />
    ))
    .addWithJSX('Input (error)', () => (
        <Input
            state="error"
            bottomText="This is the error message."
            placeholder="placeholder..."
            value="Input value"
            onChange={() => {}}
        />
    ))
    .addWithJSX('Input (disabled)', () => (
        <Input
            isDisabled
            placeholder="placeholder..."
            value="Input value"
            onChange={() => {}}
        />
    ))
    .addWithJSX('Textarea', () => (
        <TextArea
            value="Text value of textarea"
            onChange={() => {}}
        />
    ))
    .addWithJSX('Textarea (error)', () => (
        <TextArea
            state="error"
            bottomText="This is the description of the error."
            value="Text value of textarea"
            onChange={() => {}}
        />
    ))
    .addWithJSX('Textarea (disabled)', () => (
        <TextArea
            isDisabled
            value="Text value of textarea"
            onChange={() => {}}
        />
    ))
    .addWithJSX('Checkbox', () => (
        <Checkbox
            isChecked={false}
            onClick={() => {}}
        >
            Show passphrase
        </Checkbox>
    ))
    .addWithJSX('Checkbox (checked)', () => (
        <Checkbox
            isChecked
            onClick={() => {}}
        >
            Show passphrase
        </Checkbox>
    ))
    .addWithJSX('Select', () => (
        <Select
            isSearchable={false}
            isClearable={false}
            value="test"
            options={[
                { value: 'hello', label: 'Hello' },
                { value: 'world', label: 'World' },
            ]}
            onChange={() => {}}
        />
    ))
    .addWithJSX('Select (Async)', () => (
        <AsyncSelect
            defaultOptions={[
                { value: 'hello', label: 'Hello' },
                { value: 'world', label: 'World' },
            ]}
            cacheOptions={false}
            onInputChange={() => {}}
            loadOptions={loadOptions}
        />
    ))
    .addWithJSX('Select (disabled)', () => (
        <Select
            isDisabled
            value="test"
            options={[
                { value: 'hello', label: 'Hello' },
                { value: 'world', label: 'World' },
            ]}
            onChange={() => {}}
        />
    ));