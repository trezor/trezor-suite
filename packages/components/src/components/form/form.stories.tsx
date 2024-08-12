import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';

import { Input, Textarea, Select, Checkbox, Radio, Switch, Button, Range } from '../../index';
import { StoryColumn } from '../../support/Story';

const Heading = styled.h2``;

const SubHeading = styled.h4`
    margin: 10px 0;
`;

const Label = styled.div``;

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

const meta: Meta = {
    title: 'Form/All',
} as Meta;
export default meta;

export const All: StoryObj = {
    render: () => (
        <>
            <StoryColumn minWidth={520}>
                <Heading>Input</Heading>
                <SubHeading>Default</SubHeading>
                <Input value="Default input with select" data-testid="input-default" />
                <Input
                    value="Input with select"
                    data-testid="input-select"
                    innerAddon={
                        <Select
                            isClean
                            value={{ label: 'BTC', value: 'BTC' }}
                            options={[
                                { label: 'ETH', value: 'ETH' },
                                { label: 'XRP', value: 'XRP' },
                                { label: 'BCT', value: 'BCT' },
                                { label: 'UAN', value: 'UAN' },
                            ]}
                        />
                    }
                />
                <Input size="small" value="Small input" data-testid="input-default-small" />
                <Input
                    inputState="error"
                    value="Input with error"
                    data-testid="input-default-error"
                />
                <Input
                    inputState="warning"
                    value="Input with warning"
                    data-testid="input-default-warning"
                />
                <Input isDisabled value="Disabled input" data-testid="input-default-disabled" />
                <SubHeading>Monospace with button</SubHeading>
                <Input
                    value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                    data-testid="input-block-monospace-button"
                />
                <SubHeading>Partially hidden</SubHeading>
                <Input
                    value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                    data-testid="input-block-monospace-hidden"
                />
                <SubHeading>With label &amp; bottom text</SubHeading>
                <Input value="Input label" data-testid="input-label" bottomText="bottom text" />
                <Input
                    size="small"
                    value="Small input label"
                    data-testid="input-small-label"
                    bottomText="bottom text"
                />
                <Input
                    inputState="error"
                    value="Input label with error"
                    data-testid="input-error-label"
                    bottomText="bottom text"
                />
                <Input
                    inputState="warning"
                    value="Input label with warning"
                    data-testid="input-warning-label"
                    bottomText="bottom text"
                    labelHoverRight={
                        <Button variant="tertiary" icon="QR" onClick={() => {}}>
                            Scan QR code
                        </Button>
                    }
                />
                <Input
                    isDisabled
                    value="Disabled input label"
                    data-testid="input-disabled-label"
                    label={<Label>label</Label>}
                    bottomText="bottom text"
                />
            </StoryColumn>
            <StoryColumn minWidth={300} maxWidth={400}>
                <Heading>Textarea</Heading>
                <SubHeading>Default</SubHeading>
                <Textarea value="test value" />
                <Textarea
                    value="test value"
                    inputState="warning"
                    label="Top label"
                    bottomText="bottom text"
                />
                <Textarea
                    value="test value"
                    inputState="error"
                    label="Top label"
                    bottomText="bottom text"
                />
                <Textarea label="Top label" bottomText="bottom text" />
                <Textarea value="test value" disabled />
            </StoryColumn>
            <StoryColumn maxWidth={200}>
                <Heading>Switch</Heading>

                <SubHeading>Off</SubHeading>
                <Switch
                    data-testid="switch-off"
                    onChange={() => {}}
                    isChecked={false}
                    label="Headline"
                />

                <SubHeading>Off disabled</SubHeading>
                <Switch
                    data-testid="switch-off-disabled"
                    isDisabled
                    onChange={() => {}}
                    isChecked={false}
                    label="Headline"
                />

                <SubHeading>On</SubHeading>
                <Switch
                    isChecked
                    onChange={() => {}}
                    isDisabled
                    data-testid="switch-on"
                    label="Headline"
                />

                <SubHeading>On disabled</SubHeading>
                <Switch
                    data-testid="switch-on-disabled"
                    isDisabled
                    onChange={() => {}}
                    isChecked
                    label="Headline"
                />

                <SubHeading>Off small</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked={false}
                    isSmall
                    data-testid="switch-off-small"
                    label="Headline"
                />

                <SubHeading>Off small disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked={false}
                    isSmall
                    data-testid="switch-off-small-disabled"
                    label="Headline"
                />

                <SubHeading>On small</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked
                    isSmall
                    data-testid="switch-on-small"
                    label="Headline"
                />

                <SubHeading>On small disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked
                    isSmall
                    data-testid="switch-on-small-disabled"
                    label="Headline"
                />

                <SubHeading>Off alert</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked={false}
                    isAlert
                    data-testid="switch-off-alert"
                    label="Headline"
                />

                <SubHeading>Off alert disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked={false}
                    isAlert
                    data-testid="switch-off-alert-disabled"
                    label="Headline"
                />

                <SubHeading>On alert</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked
                    isAlert
                    data-testid="switch-on-alert"
                    label="Headline"
                />

                <SubHeading>On alert disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked
                    isAlert
                    data-testid="switch-on-alert-disabled"
                    label="Headline"
                />
            </StoryColumn>
            <StoryColumn maxWidth={200}>
                <Heading>Checkbox</Heading>
                <SubHeading>Unchecked</SubHeading>
                <Checkbox onClick={() => {}} data-testid="checkbox">
                    Label
                </Checkbox>
                <SubHeading>Checked</SubHeading>
                <Checkbox onClick={() => {}} isChecked data-testid="checkbox-checked">
                    Label
                </Checkbox>
            </StoryColumn>
            <StoryColumn maxWidth={200}>
                <Heading>Radio Buttons</Heading>
                <SubHeading>Unchecked</SubHeading>
                <Radio onClick={() => {}} data-testid="radio-button">
                    Label
                </Radio>
                <SubHeading>Checked</SubHeading>
                <Radio onClick={() => {}} isChecked data-testid="radio-button-checked">
                    Label
                </Radio>
            </StoryColumn>
            <StoryColumn maxWidth={200}>
                <Heading>Select</Heading>
                <Select options={SELECT_OPTIONS} label="Not selected" />
                <Select
                    options={SELECT_OPTIONS}
                    value={{
                        label: 'Option one',
                        value: 'value-one',
                    }}
                    label="Selected"
                />
                <Select
                    options={SELECT_OPTIONS}
                    value={{
                        label: 'Option one',
                        value: 'value-one',
                    }}
                    label="Small"
                    size="small"
                />

                <Select isDisabled label="Disabled" />
            </StoryColumn>
            <StoryColumn>
                <Heading>Range</Heading>
                <Range value={21} onChange={() => {}} />
            </StoryColumn>
        </>
    ),
};
