import React from 'react';
import styled, { css } from 'styled-components';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { Checkbox, Switch, Input, InputPin, TextArea, Select, H1, H5 } from '@trezor/components';
import { infoOptions } from '../../support/info';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const StyledInput = styled(Input)`
    margin-bottom: ${props => (props.tooltipAction ? '30px' : '10px')};
`;

type MarginProps = { size: string };
const Margin = styled.div<MarginProps>`
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    margin-bottom: ${props => `${props.size}px`};
`;

const Row = styled.div`
    display: flex;
    margin: 0.5rem 0 2rem;
    flex-wrap: wrap;
`;

const StyledSelect = styled(Select)<typeof Select>`
    width: 100%;
    margin-bottom: 10px;
`;

type DataWrapperProps = { width?: string };
const DataWrapper = styled.div<DataWrapperProps>`
    display: flex;
    ${props =>
        props.width &&
        css`
            width: ${props.width};
        `}
`;

Wrapper.displayName = 'Wrapper';

storiesOf('Form', module).add(
    'All',
    () => (
        <Wrapper>
            <H1>Input</H1>
            <H5>Basic</H5>
            <Row>
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic' }}
                />

                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_info' }}
                    state="info"
                />

                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_success' }}
                    state="success"
                />
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_warning' }}
                    state="warning"
                />
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_error' }}
                    state="error"
                />

                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_basic_disabled' }}
                    isDisabled
                />
            </Row>

            <H5>with value</H5>
            <Row>
                <StyledInput
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value' }}
                />

                <StyledInput
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_info' }}
                    state="info"
                />

                <StyledInput
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_success' }}
                    state="success"
                />
                <StyledInput
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_warning' }}
                    state="warning"
                />
                <StyledInput
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_error' }}
                    state="error"
                />

                <StyledInput
                    type="text"
                    value="Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo."
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_disabled' }}
                    isDisabled
                />
            </Row>

            <H5>with loading</H5>
            <Row>
                <StyledInput
                    type="text"
                    isLoading
                    value="Sample text"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_value_loading' }}
                />
            </Row>

            <H5>with label and bottomText </H5>
            <Row>
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText' }}
                />

                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_info' }}
                    state="info"
                />

                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_success' }}
                    state="success"
                />
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_warning' }}
                    state="warning"
                />
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_error' }}
                    state="error"
                />

                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    bottomText="bottomText"
                    topLabel="Label"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'input_label_bottomText_disabled' }}
                    isDisabled
                />
            </Row>

            <H5>with tooltipAction</H5>
            <Row>
                <StyledInput
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    tooltipAction="Example tooltipAction"
                    wrapperProps={{ 'data-test': 'input_tooltipAction' }}
                />
            </Row>

            <H1>InputPin</H1>
            <Row>
                <InputPin
                    value="1234"
                    onDeleteClick={() => {}}
                    wrapperProps={{ 'data-test': 'input_pin' }}
                />
            </Row>

            <H1>TextArea</H1>
            <H5>Basic</H5>
            <Row>
                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_basic' }}
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_basic_info' }}
                        state="info"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_basic_success' }}
                        state="success"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_basic_warning' }}
                        state="warning"
                    />
                </Margin>
                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_basic_error' }}
                        state="error"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_basic_disabled' }}
                        isDisabled
                    />
                </Margin>
            </Row>

            <H5>with label and bottomText </H5>
            <Row>
                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        bottomText="bottomText"
                        topLabel="Label"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_label_bottomText' }}
                    />
                </Margin>
                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        bottomText="bottomText"
                        topLabel="Label"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_label_bottomText_info' }}
                        state="info"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        bottomText="bottomText"
                        topLabel="Label"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_label_bottomText_success' }}
                        state="success"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        bottomText="bottomText"
                        topLabel="Label"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_label_bottomText_warning' }}
                        state="warning"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        bottomText="bottomText"
                        topLabel="Label"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_label_bottomText_error' }}
                        state="error"
                    />
                </Margin>

                <Margin size="30">
                    <TextArea
                        value=""
                        placeholder="Placeholder"
                        bottomText="bottomText"
                        topLabel="Label"
                        onChange={() => {}}
                        wrapperProps={{ 'data-test': 'textarea_label_bottomText_disabled' }}
                        isDisabled
                    />
                </Margin>
            </Row>

            <H1>Select</H1>
            <Row>
                <H5>Basic</H5>
                <DataWrapper width="100%" data-test="select_basic_placeholder">
                    <StyledSelect
                        isSearchable
                        placeholder="Example placeholder"
                        options={[
                            { value: 'hello', label: 'Hello' },
                            { value: 'world', label: 'World' },
                        ]}
                    />
                </DataWrapper>
                <DataWrapper width="100%" data-test="select_basic">
                    <StyledSelect
                        isSearchable
                        value={{
                            value: 'hello',
                            label:
                                'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo.',
                        }}
                        options={[
                            { value: 'hello', label: 'Hello' },
                            { value: 'world', label: 'World' },
                        ]}
                    />
                </DataWrapper>
                <H5>clearable</H5>
                <DataWrapper width="100%" data-test="select_clearable">
                    <StyledSelect
                        isSearchable
                        isClearable
                        withDropdownIndicator
                        value={{
                            value: 'hello',
                            label:
                                'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo.',
                        }}
                        options={[
                            { value: 'hello', label: 'Hello' },
                            { value: 'world', label: 'World' },
                        ]}
                    />
                </DataWrapper>

                <H5>without dropdown indicator</H5>
                <DataWrapper width="100%" data-test="select_withoutDropdown">
                    <StyledSelect
                        isSearchable
                        withDropdownIndicator={false}
                        value={{
                            value: 'hello',
                            label:
                                'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo.',
                        }}
                        options={[
                            { value: 'hello', label: 'Hello' },
                            { value: 'world', label: 'World' },
                        ]}
                    />
                </DataWrapper>

                <H5>disabled</H5>
                <DataWrapper width="100%" data-test="select_disabled">
                    <StyledSelect
                        isSearchable
                        isClearable
                        isDisabled
                        withDropdownIndicator
                        value={{
                            value: 'hello',
                            label:
                                'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer imperdiet lectus quis justo.',
                        }}
                        options={[
                            { value: 'hello', label: 'Hello' },
                            { value: 'world', label: 'World' },
                        ]}
                    />
                </DataWrapper>
            </Row>

            <H1>Checkbox</H1>
            <Row>
                <Checkbox onClick={() => {}} data-test="checkbox_unchecked">
                    Label
                </Checkbox>
            </Row>
            <Row>
                <Checkbox onClick={() => {}} isChecked data-test="checkbox_checked">
                    Label
                </Checkbox>
            </Row>
            <H1>Switch</H1>

            <Row>
                <DataWrapper data-test="switch_basic_unchecked">
                    <Switch onChange={() => {}} checked={false} />
                </DataWrapper>
                <DataWrapper data-test="switch_basic_checked">
                    <Switch onChange={() => {}} checked />
                </DataWrapper>
                <DataWrapper data-test="switch_basic_disabled">
                    <Switch onChange={() => {}} checked={false} disabled />
                </DataWrapper>
            </Row>

            <H5>small</H5>
            <Row>
                <DataWrapper data-test="switch_small_unchecked">
                    <Switch onChange={() => {}} isSmall checked={false} />
                </DataWrapper>

                <DataWrapper data-test="switch_small_checked">
                    <Switch onChange={() => {}} isSmall checked />
                </DataWrapper>

                <DataWrapper data-test="switch_small_disabled">
                    <Switch onChange={() => {}} isSmall disabled checked={false} />
                </DataWrapper>
            </Row>
            <H5>without icons </H5>
            <Row>
                <DataWrapper data-test="switch_noicon_unchecked">
                    <Switch
                        onChange={() => {}}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        checked={false}
                    />
                </DataWrapper>
                <DataWrapper data-test="switch_noicon_checked">
                    <Switch onChange={() => {}} uncheckedIcon={false} checkedIcon={false} checked />
                </DataWrapper>

                <DataWrapper data-test="switch_noicon_disabled">
                    <Switch
                        onChange={() => {}}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        disabled
                        checked={false}
                    />
                </DataWrapper>
            </Row>
            <Row>
                <DataWrapper data-test="switch_noicon_small_unchecked">
                    <Switch
                        onChange={() => {}}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        isSmall
                        checked={false}
                    />
                </DataWrapper>
                <DataWrapper data-test="switch_noicon_small_checked">
                    <Switch
                        onChange={() => {}}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        isSmall
                        checked
                    />
                </DataWrapper>
                <DataWrapper data-test="switch_noicon_small_disabled">
                    <Switch
                        onChange={() => {}}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        isSmall
                        disabled
                        checked={false}
                    />
                </DataWrapper>
            </Row>
        </Wrapper>
    ),
    {
        info: {
            disable: true,
        },
    }
);

storiesOf('Form', module)
    .add(
        'Input',
        () => {
            const type = select(
                'Type',
                {
                    Text: 'text',
                    Password: 'password',
                },
                'text'
            );
            const isDisabled = boolean('Disabled', false);
            const value = text('Input value', '');
            const placeholder = text('Placeholder', 'placeholder...');
            const state: any = select(
                'State',
                {
                    Default: undefined,
                    Error: 'error',
                    Success: 'success',
                    Warning: 'warning',
                },
                undefined
            );
            const bottomText = text('Bottom text', 'bottom text');
            const topLabel = text('Top label', 'Input label');

            return (
                <Input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    bottomText={bottomText}
                    topLabel={topLabel}
                    onChange={() => {}}
                    tooltipAction={text('tooltipAction', null)}
                    {...(state ? { state } : {})}
                    {...(isDisabled ? { isDisabled } : {})}
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Input } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add('Input Pin', () => <InputPin value={text('Input value', '')} onDeleteClick={() => {}} />, {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { InputPin } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add(
        'TextArea',
        () => {
            const state: any = select(
                'State',
                {
                    Default: undefined,
                    Error: 'error',
                    Success: 'success',
                    Warning: 'warning',
                },
                undefined
            );
            const isDisabled = boolean('Disabled', false);

            return (
                <TextArea
                    value={text('Value', '')}
                    placeholder={text('Placeholder', 'placeholder...')}
                    bottomText={text('Bottom text', 'bottom text')}
                    topLabel={text('Top label', 'Textarea label')}
                    tooltipAction={text('tooltipAction', null)}
                    {...(isDisabled ? { isDisabled } : {})}
                    {...(state ? { state } : {})} // hack to hide state prop if its value is null
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { TextArea } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add(
        'Checkbox',
        () => {
            const isChecked = boolean('Checked', false);
            return (
                <Checkbox onClick={() => {}} {...(isChecked ? { isChecked } : {})}>
                    {text('Checkbox text', 'Checkbox')}
                </Checkbox>
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Checkbox } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add(
        'Switch',
        () => {
            const uncheckedIcon = select(
                'uncheckedIcon',
                {
                    Default: null,
                    false: false,
                },
                null
            );
            const checkedIcon = select(
                'checkedIcon',
                {
                    Default: null,
                    false: false,
                },
                null
            );
            const disabled = boolean('Disabled', false);
            const isSmall = boolean('isSmall', false);
            const checked = boolean('Checked', false);
            return (
                <Switch
                    key={`force-unmount-${isSmall}`}
                    onChange={() => {}}
                    checked={checked}
                    {...(disabled ? { disabled } : {})}
                    {...(isSmall ? { isSmall } : {})}
                    {...(checkedIcon !== null ? { checkedIcon } : {})}
                    {...(uncheckedIcon !== null ? { uncheckedIcon } : {})}
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Switch } from 'trezor-ui-components';
            ~~~
            *<Switch> is just a wrapper around [react-switch](https://www.npmjs.com/package/react-switch) component. See the [official documentation](https://github.com/markusenglund/react-switch) for more information about its props and usage.*
            `,
            },
        }
    )
    .add(
        'Select',
        () => {
            const isSearchable = boolean('Searchable', false);
            const isClearable = boolean('Clearable', false);
            const isDisabled = boolean('Disabled', false);
            const withDropdownIndicator = boolean('withDropdownIndicator', true);
            const topLabel = text('Top label', 'Input label');
            const values: any = {
                None: null,
                Hello: { value: 'hello', label: 'Hello' },
                World: { value: 'world', label: 'World' },
            };
            const options = Object.keys(values)
                .filter((k: string) => {
                    return values[k];
                })
                .map((k: string) => {
                    return values[k];
                });

            return (
                <Select
                    {...(!isSearchable ? { isSearchable } : {})}
                    {...(isClearable ? { isClearable } : {})}
                    {...(isDisabled ? { isDisabled } : {})}
                    {...(withDropdownIndicator ? {} : { withDropdownIndicator })}
                    value={select('Value', values, null)}
                    options={options}
                    topLabel={topLabel}
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Select } from 'trezor-ui-components';
            ~~~
            *<Select> is just a styling wrapper around [react-select](https://react-select.com) component. See the [official documentation](https://react-select.com) for more information about its props and usage.*
            `,
            },
        }
    );
