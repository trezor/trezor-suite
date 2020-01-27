import React from 'react';
import styled from 'styled-components';
import { Input, Textarea, Select, Checkbox, Switch } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../components/Story';

const Heading = styled.h2``;

const SubHeading = styled.h4`
    margin: 10px 0;
`;

const SELECT_OPTIONS = [
    {
        label: 'Option one',
        value: 'value-one',
    },
    {
        label: 'Option two',
        value: 'value-two',
    },
    {
        label: 'Option tree',
        value: 'value-tree',
    },
];

storiesOf('Form', module).add(
    'All',
    () => {
        return (
            <>
                <StoryColumn minWidth={520}>
                    <Heading>Input</Heading>
                    <SubHeading>Default</SubHeading>
                    <Input value="Default input" dataTest="input-default" />
                    <Input variant="small" value="Small input" dataTest="input-default-small" />
                    <Input state="error" value="Input with error" dataTest="input-default-error" />
                    <Input
                        state="warning"
                        value="Input with warning"
                        dataTest="input-default-warning"
                    />
                    <Input
                        state="success"
                        value="Input with success"
                        dataTest="input-default-success"
                    />
                    <Input disabled value="Disabled input" dataTest="input-default-disabled" />
                    <SubHeading>Monospace with button</SubHeading>
                    <Input
                        value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                        display="block"
                        dataTest="input-block-monospace-button"
                        button={{
                            text: 'Scan',
                            icon: 'QR',
                            onClick: () => {},
                        }}
                    />
                    <SubHeading>Partially hidden</SubHeading>
                    <Input
                        value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                        display="block"
                        dataTest="input-block-monospace-hidden"
                        isPartiallyHidden
                        button={{
                            text: 'Show full address',
                            icon: 'TREZOR',
                            onClick: () => {},
                        }}
                    />
                    <SubHeading>With label &amp; bottom text</SubHeading>
                    <Input
                        value="Input label"
                        dataTest="input-label'"
                        topLabel="Label"
                        bottomText="bottom text"
                    />
                    <Input
                        variant="small"
                        value="Small input label"
                        dataTest="input-small-label"
                        topLabel="Label"
                        bottomText="bottom text"
                    />
                    <Input
                        state="error"
                        value="Input label with error"
                        dataTest="input-error-label"
                        topLabel="Label"
                        bottomText="bottom text"
                    />
                    <Input
                        state="warning"
                        value="Input label with warning"
                        dataTest="input-warning-label"
                        topLabel="Label"
                        bottomText="bottom text"
                    />
                    <Input
                        state="success"
                        value="Input label with success"
                        dataTest="input-success-label"
                        topLabel="Label"
                        bottomText="bottom text"
                    />
                    <Input
                        disabled
                        value="Disabled input label"
                        dataTest="input-disabled-label"
                        topLabel="Label"
                        bottomText="bottom text"
                    />
                </StoryColumn>
                <StoryColumn minWidth={300}>
                    <Heading>Textarea</Heading>
                    <SubHeading>Default</SubHeading>
                    <Textarea
                        value="test value"
                        wrapperProps={{ 'data-test': 'textarea-default' }}
                    />
                    <Textarea
                        value="test value"
                        state="success"
                        wrapperProps={{ 'data-test': 'textarea-success' }}
                        topLabel="Top label"
                        bottomText="bottom text"
                    />
                    <Textarea
                        value="test value"
                        state="warning"
                        wrapperProps={{ 'data-test': 'textarea-warning' }}
                        topLabel="Top label"
                        bottomText="bottom text"
                    />
                    <Textarea
                        value="test value"
                        state="error"
                        wrapperProps={{ 'data-test': 'textarea-error' }}
                        topLabel="Top label"
                        bottomText="bottom text"
                    />
                    <Textarea
                        wrapperProps={{ 'data-test': 'textarea-label' }}
                        topLabel="Top label"
                        bottomText="bottom text"
                    />
                    <Textarea
                        value="test value"
                        disabled
                        wrapperProps={{ 'data-test': 'textarea-disabled' }}
                    />
                </StoryColumn>
                <StoryColumn>
                    <Heading>Switch</Heading>
                    <SubHeading>Off</SubHeading>
                    <Switch onChange={() => {}} checked={false} />
                    <SubHeading>On</SubHeading>
                    <Switch onChange={() => {}} checked />
                    <SubHeading>Off small</SubHeading>
                    <Switch onChange={() => {}} checked={false} isSmall />
                    <SubHeading>On</SubHeading>
                    <Switch onChange={() => {}} checked isSmall />
                </StoryColumn>
                <StoryColumn>
                    <Heading>Checkbox</Heading>
                    <SubHeading>Unchecked</SubHeading>
                    <Checkbox onClick={() => {}} data-test="checkbox">
                        Label
                    </Checkbox>
                    <SubHeading>Checked</SubHeading>
                    <Checkbox onClick={() => {}} isChecked data-test="checkbox-checked">
                        Label
                    </Checkbox>
                </StoryColumn>
                <StoryColumn>
                    <Heading>Select</Heading>
                    <Select
                        options={SELECT_OPTIONS}
                        topLabel="Not selected"
                        wrapperProps={{
                            'data-test': 'select',
                        }}
                    />
                    <Select
                        options={SELECT_OPTIONS}
                        value={{
                            label: 'Option one',
                            value: 'value-one',
                        }}
                        topLabel="Selected"
                        wrapperProps={{
                            'data-test': 'select-selected',
                        }}
                    />
                    <Select
                        options={SELECT_OPTIONS}
                        value={{
                            label: 'Option one',
                            value: 'value-one',
                        }}
                        topLabel="Selected"
                        wrapperProps={{
                            'data-test': 'select-small',
                        }}
                        variant="small"
                    />

                    <Select
                        isDisabled
                        topLabel="Disabled"
                        wrapperProps={{
                            'data-test': 'select-disabled',
                        }}
                    />
                </StoryColumn>
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
