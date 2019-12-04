import React from 'react';
import styled from 'styled-components';
import { Input, Checkbox, Switch } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Col = styled.div`
    margin: 1rem 0 2rem;
`;

const InputWrapper = styled.div`
    margin-bottom: 1rem;
    width: 100%;
`;

const Heading = styled.h2``;

const SubHeading = styled.h4`
    margin-bottom: 10px;
`;

storiesOf('Form', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Heading>Switch</Heading>
                <Col>
                    <SubHeading>Off</SubHeading>
                    <InputWrapper>
                        <Switch onChange={() => {}} checked={false} />
                    </InputWrapper>
                    <SubHeading>On</SubHeading>
                    <InputWrapper>
                        <Switch onChange={() => {}} checked />
                    </InputWrapper>
                </Col>

                <Heading>Checkbox</Heading>
                <Col>
                    <SubHeading>Unchecked</SubHeading>
                    <InputWrapper>
                        <Checkbox onClick={() => {}} data-test="checkbox">
                            Label
                        </Checkbox>
                    </InputWrapper>
                    <SubHeading>Checked</SubHeading>
                    <InputWrapper>
                        <Checkbox onClick={() => {}} isChecked data-test="checkbox-checked">
                            Label
                        </Checkbox>
                    </InputWrapper>
                </Col>

                <Heading>Input</Heading>
                <Col>
                    <SubHeading>Short</SubHeading>
                    <InputWrapper>
                        <Input
                            value="Short input"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small short input"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-small' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Short input with error"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-error' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Short input with warning"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-warning' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Short input with success"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-success' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled short input"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-disabled' }}
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>Default</SubHeading>
                    <InputWrapper>
                        <Input
                            value="Default input"
                            wrapperProps={{ 'data-test': 'input-default' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small input"
                            wrapperProps={{ 'data-test': 'input-default-small' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Input with error"
                            wrapperProps={{ 'data-test': 'input-default-error' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Input with warning"
                            wrapperProps={{ 'data-test': 'input-default-warning' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Input with success"
                            wrapperProps={{ 'data-test': 'input-default-success' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled input"
                            wrapperProps={{ 'data-test': 'input-default-disabled' }}
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>With label &amp; bottom text</SubHeading>
                    <InputWrapper>
                        <Input
                            value="Input label"
                            wrapperProps={{ 'data-test': 'input-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small input label"
                            wrapperProps={{ 'data-test': 'input-small-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Input label with error"
                            wrapperProps={{ 'data-test': 'input-error-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Input label with warning"
                            wrapperProps={{ 'data-test': 'input-warning-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Input label with success"
                            wrapperProps={{ 'data-test': 'input-success-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled input label"
                            wrapperProps={{ 'data-test': 'input-disabled-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>Block</SubHeading>
                    <InputWrapper>
                        <Input
                            value="Block input"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small block input"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-small' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Block input with error"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-error' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Block input with warning"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-warning' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Block input with success"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-success' }}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled block input"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-disabled' }}
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>Monospace with button</SubHeading>
                    <InputWrapper>
                        <Input
                            value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-monospace-button' }}
                            button={{
                                text: 'Scan',
                                icon: 'QR',
                                onClick: () => {},
                            }}
                        />
                    </InputWrapper>
                    <SubHeading>Partially hidden</SubHeading>
                    <InputWrapper>
                        <Input
                            value="0x3Ebf31732F5A987b4f130Eb359B0975EBcbd68c8"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-monospace-hidden' }}
                            isPartiallyHidden
                            button={{
                                text: 'Show full address',
                                icon: 'TREZOR',
                                onClick: () => {},
                            }}
                        />
                    </InputWrapper>
                </Col>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
