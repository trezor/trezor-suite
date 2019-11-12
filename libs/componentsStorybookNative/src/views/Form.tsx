import React from 'react';
import styled from 'styled-components/native';
import { Checkbox, Switch, Input, InputPin, TextArea, Select, H1, H5 } from '@trezor/components';

const Wrapper = styled.View`
    padding: 10px;
`;

const Section = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Col = styled.View`
    flex-direction: column;
`;

const Form = () => {
    const options: any = {
        None: null,
        Hello: { value: 'hello', label: 'Hello' },
        World: { value: 'world', label: 'World' },
    };

    return (
        <Wrapper>
            <H1>Input</H1>
            <H5>Basic</H5>
            <Col>
                <Section>
                    <Input
                        type="text"
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'input_basic' }}
                    />
                </Section>

                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_info' }}
                    state="info"
                />

                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_success' }}
                    state="success"
                />
                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_warning' }}
                    state="warning"
                />
                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_error' }}
                    state="error"
                />

                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_disabled' }}
                    isDisabled
                />
            </Col>

            <H5>with value</H5>
            <Col>
                <Input
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value' }}
                />

                <Input
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_info' }}
                    state="info"
                />

                <Input
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_success' }}
                    state="success"
                />
                <Input
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_warning' }}
                    state="warning"
                />
                <Input
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_error' }}
                    state="error"
                />

                <Input
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_disabled' }}
                    isDisabled
                />
            </Col>

            <H5>with label and bottomText</H5>
            <Col>
                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText' }}
                />

                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_info' }}
                    state="info"
                />

                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_success' }}
                    state="success"
                />
                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_warning' }}
                    state="warning"
                />
                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_error' }}
                    state="error"
                />

                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_disabled' }}
                    isDisabled
                />
            </Col>

            <H5>with tooltipAction</H5>
            <Col>
                <Input
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    tooltipAction="Example tooltipAction"
                    wrapperProps={{ 'data-test': 'input_tooltipAction' }}
                />
            </Col>

            <H1>InputPin</H1>
            <Col>
                <InputPin
                    value="1234"
                    onDeleteClick={() => {}}
                    wrapperProps={{ 'data-test': 'input_pin' }}
                />
            </Col>

            <H1>TextArea</H1>
            <H5>Basic</H5>
            <Col>
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic' }}
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_info' }}
                    state="info"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_success' }}
                    state="success"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_warning' }}
                    state="warning"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_error' }}
                    state="error"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_disabled' }}
                    isDisabled
                />
            </Col>

            <H5>with label and bottomText</H5>
            <Col>
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_label_bottomText' }}
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_label_bottomText_info' }}
                    state="info"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_label_bottomText_success' }}
                    state="success"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_label_bottomText_warning' }}
                    state="warning"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_label_bottomText_error' }}
                    state="error"
                />
                <TextArea
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_label_bottomText_disabled' }}
                    isDisabled
                />
            </Col>

            <H1>Select</H1>
            <Col>
                <H5>Basic</H5>
                <Select
                    isSearchable
                    placeholder="Example placeholder"
                    options={options}
                    onChange={() => {}}
                />
                <Select isSearchable value={options.Hello} options={options} onChange={() => {}} />
                <H5>clearable</H5>
                <Select
                    isSearchable
                    isClearable
                    withDropdownIndicator
                    value={options.World}
                    options={options}
                    placeholder="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                />

                <H5>without dropdown indicator</H5>
                <Select
                    isSearchable
                    withDropdownIndicator={false}
                    value={options.Hello}
                    options={options}
                    placeholder="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                />

                <H5>disabled</H5>
                <Select
                    isSearchable
                    isClearable
                    isDisabled
                    withDropdownIndicator
                    value={options.World}
                    options={options}
                    placeholder="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                />
            </Col>

            <H1>Checkbox</H1>
            <Col>
                <Checkbox onClick={() => {}} data-test="checkbox_unchecked">
                    Label
                </Checkbox>
            </Col>
            <Col>
                <Checkbox onClick={() => {}} isChecked data-test="checkbox_checked">
                    Label
                </Checkbox>
            </Col>
            <H1>Switch</H1>
            <H5>basic</H5>
            <Col>
                <Switch onChange={() => {}} checked={false} />
                <Switch onChange={() => {}} checked />
                <Switch onChange={() => {}} checked={false} disabled />
            </Col>

            <H5>small</H5>
            <Col>
                <Switch onChange={() => {}} isSmall checked={false} />
                <Switch onChange={() => {}} isSmall checked />
                <Switch onChange={() => {}} isSmall disabled checked={false} />
            </Col>
        </Wrapper>
    );
};

export default Form;
