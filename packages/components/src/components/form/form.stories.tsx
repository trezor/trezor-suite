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

export default {
    title: 'Form/All',
} as Meta;

export const All: StoryObj = {
    render: () => (
        <>
            <StoryColumn minWidth={520}>
                <Heading>Input</Heading>
                <SubHeading>Default</SubHeading>
                <Input value="Default input with select" dataTest="input-default" />
                <Input
                    value="Input with select"
                    dataTest="input-select"
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
                <Input size="small" value="Small input" dataTest="input-default-small" />
                <Input inputState="error" value="Input with error" dataTest="input-default-error" />
                <Input
                    inputState="warning"
                    value="Input with warning"
                    dataTest="input-default-warning"
                />
                <Input
                    inputState="success"
                    value="Input with success"
                    dataTest="input-default-success"
                />
                <Input isDisabled value="Disabled input" dataTest="input-default-disabled" />
                <SubHeading>Monospace with button</SubHeading>
                <Input
                    value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                    dataTest="input-block-monospace-button"
                />
                <SubHeading>Partially hidden</SubHeading>
                <Input
                    value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                    dataTest="input-block-monospace-hidden"
                />
                <SubHeading>With label &amp; bottom text</SubHeading>
                <Input value="Input label" dataTest="input-label" bottomText="bottom text" />
                <Input
                    size="small"
                    value="Small input label"
                    dataTest="input-small-label"
                    bottomText="bottom text"
                />
                <Input
                    inputState="error"
                    value="Input label with error"
                    dataTest="input-error-label"
                    bottomText="bottom text"
                />
                <Input
                    inputState="warning"
                    value="Input label with warning"
                    dataTest="input-warning-label"
                    bottomText="bottom text"
                    labelHoverAddon={
                        <Button variant="tertiary" icon="QR" onClick={() => {}}>
                            Scan QR code
                        </Button>
                    }
                />
                <Input
                    inputState="success"
                    value="Input label with success"
                    dataTest="input-success-label"
                    bottomText="bottom text"
                    label={<Label>Label left</Label>}
                    labelRight={<Label>Label right</Label>}
                    labelHoverAddon={
                        <Button
                            variant="tertiary"
                            icon="QR"
                            onClick={() => {
                                console.log('aaa');
                            }}
                        >
                            Scan QR code
                        </Button>
                    }
                />
                <Input
                    isDisabled
                    value="Disabled input label"
                    dataTest="input-disabled-label"
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
                    inputState="success"
                    label="Top label"
                    bottomText="bottom text"
                />
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
                    dataTest="switch-off"
                    onChange={() => {}}
                    isChecked={false}
                    label="Headline"
                />

                <SubHeading>Off disabled</SubHeading>
                <Switch
                    dataTest="switch-off-disabled"
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
                    dataTest="switch-on"
                    label="Headline"
                />

                <SubHeading>On disabled</SubHeading>
                <Switch
                    dataTest="switch-on-disabled"
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
                    dataTest="switch-off-small"
                    label="Headline"
                />

                <SubHeading>Off small disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked={false}
                    isSmall
                    dataTest="switch-off-small-disabled"
                    label="Headline"
                />

                <SubHeading>On small</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked
                    isSmall
                    dataTest="switch-on-small"
                    label="Headline"
                />

                <SubHeading>On small disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked
                    isSmall
                    dataTest="switch-on-small-disabled"
                    label="Headline"
                />

                <SubHeading>Off alert</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked={false}
                    isAlert
                    dataTest="switch-off-alert"
                    label="Headline"
                />

                <SubHeading>Off alert disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked={false}
                    isAlert
                    dataTest="switch-off-alert-disabled"
                    label="Headline"
                />

                <SubHeading>On alert</SubHeading>
                <Switch
                    onChange={() => {}}
                    isChecked
                    isAlert
                    dataTest="switch-on-alert"
                    label="Headline"
                />

                <SubHeading>On alert disabled</SubHeading>
                <Switch
                    isDisabled
                    onChange={() => {}}
                    isChecked
                    isAlert
                    dataTest="switch-on-alert-disabled"
                    label="Headline"
                />
            </StoryColumn>
            <StoryColumn maxWidth={200}>
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
            <StoryColumn maxWidth={200}>
                <Heading>Radio Buttons</Heading>
                <SubHeading>Unchecked</SubHeading>
                <Radio onClick={() => {}} data-test="radio-button">
                    Label
                </Radio>
                <SubHeading>Checked</SubHeading>
                <Radio onClick={() => {}} isChecked data-test="radio-button-checked">
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
