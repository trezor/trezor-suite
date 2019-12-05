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

const ComponentWrapper = styled.div`
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
                    <ComponentWrapper>
                        <Switch onChange={() => {}} checked={false} data-test="switch-off" />
                    </ComponentWrapper>
                    <SubHeading>On</SubHeading>
                    <ComponentWrapper>
                        <Switch onChange={() => {}} checked data-test="switch-on" />
                    </ComponentWrapper>
                    <SubHeading>Off small</SubHeading>
                    <ComponentWrapper>
                        <Switch
                            onChange={() => {}}
                            checked={false}
                            data-test="switch-on-small"
                            isSmall
                        />
                    </ComponentWrapper>
                    <SubHeading>On</SubHeading>
                    <ComponentWrapper>
                        <Switch onChange={() => {}} checked data-test="switch-on-small" isSmall />
                    </ComponentWrapper>
                </Col>

                <Heading>Checkbox</Heading>
                <Col>
                    <SubHeading>Unchecked</SubHeading>
                    <ComponentWrapper>
                        <Checkbox onClick={() => {}} data-test="checkbox">
                            Label
                        </Checkbox>
                    </ComponentWrapper>
                    <SubHeading>Checked</SubHeading>
                    <ComponentWrapper>
                        <Checkbox onClick={() => {}} isChecked data-test="checkbox-checked">
                            Label
                        </Checkbox>
                    </ComponentWrapper>
                </Col>

                <Heading>Input</Heading>
                <Col>
                    <SubHeading>Short</SubHeading>
                    <ComponentWrapper>
                        <Input
                            value="Short input"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            variant="small"
                            value="Small short input"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-small' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="error"
                            value="Short input with error"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-error' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="warning"
                            value="Short input with warning"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-warning' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="success"
                            value="Short input with success"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-success' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            disabled
                            value="Disabled short input"
                            display="short"
                            wrapperProps={{ 'data-test': 'input-short-disabled' }}
                        />
                    </ComponentWrapper>
                </Col>

                <SubHeading>Default</SubHeading>
                <Col>
                    <ComponentWrapper>
                        <Input
                            value="Default input"
                            wrapperProps={{ 'data-test': 'input-default' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            variant="small"
                            value="Small input"
                            wrapperProps={{ 'data-test': 'input-default-small' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="error"
                            value="Input with error"
                            wrapperProps={{ 'data-test': 'input-default-error' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="warning"
                            value="Input with warning"
                            wrapperProps={{ 'data-test': 'input-default-warning' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="success"
                            value="Input with success"
                            wrapperProps={{ 'data-test': 'input-default-success' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            disabled
                            value="Disabled input"
                            wrapperProps={{ 'data-test': 'input-default-disabled' }}
                        />
                    </ComponentWrapper>
                </Col>

                <SubHeading>With label &amp; bottom text</SubHeading>
                <Col>
                    <ComponentWrapper>
                        <Input
                            value="Input label"
                            wrapperProps={{ 'data-test': 'input-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            variant="small"
                            value="Small input label"
                            wrapperProps={{ 'data-test': 'input-small-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="error"
                            value="Input label with error"
                            wrapperProps={{ 'data-test': 'input-error-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="warning"
                            value="Input label with warning"
                            wrapperProps={{ 'data-test': 'input-warning-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="success"
                            value="Input label with success"
                            wrapperProps={{ 'data-test': 'input-success-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            disabled
                            value="Disabled input label"
                            wrapperProps={{ 'data-test': 'input-disabled-label' }}
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </ComponentWrapper>
                </Col>

                <SubHeading>Block</SubHeading>
                <Col>
                    <ComponentWrapper>
                        <Input
                            value="Block input"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            variant="small"
                            value="Small block input"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-small' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="error"
                            value="Block input with error"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-error' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="warning"
                            value="Block input with warning"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-warning' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            state="success"
                            value="Block input with success"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-success' }}
                        />
                    </ComponentWrapper>
                    <ComponentWrapper>
                        <Input
                            disabled
                            value="Disabled block input"
                            display="block"
                            wrapperProps={{ 'data-test': 'input-block-disabled' }}
                        />
                    </ComponentWrapper>
                </Col>
                <Col>
                    <SubHeading>Monospace with button</SubHeading>
                    <ComponentWrapper>
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
                    </ComponentWrapper>
                    <SubHeading>Partially hidden</SubHeading>
                    <ComponentWrapper>
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
                    </ComponentWrapper>
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
