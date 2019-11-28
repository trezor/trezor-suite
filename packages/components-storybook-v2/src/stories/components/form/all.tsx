import React from 'react';
import styled from 'styled-components';
import { Input } from '@trezor/components-v2';
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
                <Heading>Input</Heading>
                <Col>
                    <SubHeading>Short</SubHeading>
                    <InputWrapper>
                        <Input value="Short input" display="short" dataTest="input-short" />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small short input"
                            display="short"
                            dataTest="input-short-small"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Short input with error"
                            display="short"
                            dataTest="input-short-error"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Short input with warning"
                            display="short"
                            dataTest="input-short-warning"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Short input with success"
                            display="short"
                            dataTest="input-short-success"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled short input"
                            display="short"
                            dataTest="input-short-disabled"
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>Default</SubHeading>
                    <InputWrapper>
                        <Input value="Default input" dataTest="input-default" />
                    </InputWrapper>
                    <InputWrapper>
                        <Input variant="small" value="Small input" dataTest="input-default-small" />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Input with error"
                            dataTest="input-default-error"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Input with warning"
                            dataTest="input-default-warning"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Input with success"
                            dataTest="input-default-success"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input disabled value="Disabled input" dataTest="input-default-disabled" />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>With label &amp; bottom text</SubHeading>
                    <InputWrapper>
                        <Input
                            value="Input label"
                            dataTest="input-label"
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small input label"
                            dataTest="input-small-label"
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Input label with error"
                            dataTest="input-error-label"
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Input label with warning"
                            dataTest="input-warning-label"
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Input label with success"
                            dataTest="input-success-label"
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled input label"
                            dataTest="input-disabled-label"
                            topLabel="Label"
                            bottomText="bottom text"
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>Block</SubHeading>
                    <InputWrapper>
                        <Input value="Block input" display="block" dataTest="input-block" />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            variant="small"
                            value="Small block input"
                            display="block"
                            dataTest="input-block-small"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="error"
                            value="Block input with error"
                            display="block"
                            dataTest="input-block-error"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="warning"
                            value="Block input with warning"
                            display="block"
                            dataTest="input-block-warning"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            state="success"
                            value="Block input with success"
                            display="block"
                            dataTest="input-block-success"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            disabled
                            value="Disabled block input"
                            display="block"
                            dataTest="input-block-disabled"
                        />
                    </InputWrapper>
                </Col>
                <Col>
                    <SubHeading>Monospace with button</SubHeading>
                    <InputWrapper>
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
