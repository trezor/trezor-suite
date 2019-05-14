import React from 'react';
import styled, { css } from 'styled-components';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';
import { H1, H5 } from 'components/Heading';
import { linkTo } from '@storybook/addon-links';

import { withInfo } from '@storybook/addon-info';
import { AsyncSelect, Select } from 'components/Select';
import Checkbox from 'components/Checkbox';
import Switch from 'components/Switch';
import Input from 'components/inputs/Input';
import PinInput from 'components/inputs/Pin';
import TextArea from 'components/Textarea';

import colors from 'config/colors';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const StyledInput = styled(Input)`
    margin-bottom: ${props => (props.tooltipAction ? '30px' : '10px')};
`;
const Margin = styled.div`
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

const BtnLink = styled.button`
    font-size: 1rem;
    color: ${colors.TEXT_SECONDARY};
    vertical-align: middle;
    background: ${colors.LANDING};
    padding: 0.5rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        color: ${colors.TEXT};
    }
`;

const StyledSelect = styled(Select)`
    width: 100%;
    margin-bottom: 10px;
`;

const DataWrapper = styled.div`
    display: flex;
    ${props =>
        props.width &&
        css`
            width: ${props.width};
        `}
`;

Wrapper.displayName = 'Wrapper';

storiesOf('Form', module).add('All', () => (
    <Wrapper>
        <H1>
            Input <BtnLink onClick={linkTo('Form', 'Input')}>{'<Input />'}</BtnLink>
        </H1>
        <H5>
            Basic <BtnLink onClick={linkTo('Form', 'Input')}>{'<Input />'}</BtnLink>
        </H5>
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

        <H5>
            with value <BtnLink onClick={linkTo('Form', 'Input')}>{'<Input />'}</BtnLink>
        </H5>
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

        <H5>
            with label and bottomText{' '}
            <BtnLink onClick={linkTo('Form', 'Input')}>
                {'<Input topLabel="Label" bottomText="bottomText"/>'}
            </BtnLink>
        </H5>
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

        <H5>
            with tooltipAction{' '}
            <BtnLink onClick={linkTo('Form', 'Input')}>
                {'<Input tooltipAction="Example tooltipAction" />'}
            </BtnLink>
        </H5>
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

        <H1>
            PinInput <BtnLink onClick={linkTo('Form', 'Input Pin')}>{'<PinInput />'}</BtnLink>
        </H1>
        <Row>
            <PinInput
                value="1234"
                onDeleteClick={() => {}}
                wrapperProps={{ 'data-test': 'input_pin' }}
            />
        </Row>

        <H1>
            TextArea <BtnLink onClick={linkTo('Form', 'TextArea')}>{'<TextArea />'}</BtnLink>
        </H1>
        <H5>
            Basic <BtnLink onClick={linkTo('Form', 'TextArea')}>{'<TextArea />'}</BtnLink>
        </H5>
        <Row>
            <Margin size="30">
                <TextArea
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic' }}
                />
            </Margin>

            <Margin size="30">
                <TextArea
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_info' }}
                    state="info"
                />
            </Margin>

            <Margin size="30">
                <TextArea
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_success' }}
                    state="success"
                />
            </Margin>

            <Margin size="30">
                <TextArea
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_warning' }}
                    state="warning"
                />
            </Margin>
            <Margin size="30">
                <TextArea
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_error' }}
                    state="error"
                />
            </Margin>

            <Margin size="30">
                <TextArea
                    type="text"
                    value=""
                    placeholder="Placeholder"
                    onChange={() => {}}
                    wrapperProps={{ 'data-test': 'textarea_basic_disabled' }}
                    isDisabled
                />
            </Margin>
        </Row>

        <H5>
            with label and bottomText{' '}
            <BtnLink onClick={linkTo('Form', 'TextArea')}>
                {'<TextArea topLabel="Label" bottomText="bottomText"/>'}
            </BtnLink>
        </H5>
        <Row>
            <Margin size="30">
                <TextArea
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
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
                    type="text"
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

        <H1>
            Select <BtnLink onClick={linkTo('Form', 'Select')}>{'<Select />'}</BtnLink>
        </H1>
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

        <H1>
            Checkbox <BtnLink onClick={linkTo('Form', 'Checkbox')}>{'<Checkbox />'}</BtnLink>
        </H1>
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
        <H1>
            Switch <BtnLink onClick={linkTo('Form', 'Switch')}>{'<Switch />'}</BtnLink>
        </H1>
        <H5>
            basic <BtnLink onClick={linkTo('Form', 'Switch')}>{'<Switch/>'}</BtnLink>
        </H5>
        <Row>
            <DataWrapper data-test="switch_basic_unchecked">
                <Switch onChange={() => {}} />
            </DataWrapper>
            <DataWrapper data-test="switch_basic_checked">
                <Switch onChange={() => {}} checked />
            </DataWrapper>
            <DataWrapper data-test="switch_basic_disabled">
                <Switch onChange={() => {}} disabled />
            </DataWrapper>
        </Row>

        <H5>
            small <BtnLink onClick={linkTo('Form', 'Switch')}>{'<Switch isSmall />'}</BtnLink>
        </H5>
        <Row>
            <DataWrapper data-test="switch_small_unchecked">
                <Switch onChange={() => {}} isSmall />
            </DataWrapper>

            <DataWrapper data-test="switch_small_checked">
                <Switch onChange={() => {}} isSmall checked />
            </DataWrapper>

            <DataWrapper data-test="switch_small_disabled">
                <Switch onChange={() => {}} isSmall disabled />
            </DataWrapper>
        </Row>
        <H5>
            without icons{' '}
            <BtnLink onClick={linkTo('Form', 'Switch')}>
                {'<Switch checkedIcon={null} uncheckedIcon={null} />'}
            </BtnLink>
        </H5>
        <Row>
            <DataWrapper data-test="switch_noicon_unchecked">
                <Switch onChange={() => {}} uncheckedIcon={null} checkedIcon={null} />
            </DataWrapper>
            <DataWrapper data-test="switch_noicon_checked">
                <Switch onChange={() => {}} uncheckedIcon={null} checkedIcon={null} checked />
            </DataWrapper>

            <DataWrapper data-test="switch_noicon_disabled">
                <Switch onChange={() => {}} uncheckedIcon={null} checkedIcon={null} disabled />
            </DataWrapper>
        </Row>
        <Row>
            <DataWrapper data-test="switch_noicon_small_unchecked">
                <Switch onChange={() => {}} uncheckedIcon={null} checkedIcon={null} isSmall />
            </DataWrapper>
            <DataWrapper data-test="switch_noicon_small_checked">
                <Switch
                    onChange={() => {}}
                    uncheckedIcon={null}
                    checkedIcon={null}
                    isSmall
                    checked
                />
            </DataWrapper>
            <DataWrapper data-test="switch_noicon_small_disabled">
                <Switch
                    onChange={() => {}}
                    uncheckedIcon={null}
                    checkedIcon={null}
                    isSmall
                    disabled
                />
            </DataWrapper>
        </Row>
    </Wrapper>
));

storiesOf('Form', module)
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
        })
    )
    .addDecorator(withKnobs)
    .add(
        'Input',
        () => {
            const type = select('Type', {
                Text: 'text',
                Password: 'password',
            });
            const isDisabled = boolean('Disabled', false);
            const value = text('Input value', '');
            const placeholder = text('Placeholder', 'placeholder...');
            const state = select(
                'State',
                {
                    Default: null,
                    Error: 'error',
                    Success: 'success',
                    Warning: 'warning',
                },
                null
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
                    tooltipAction={text('tooltipAction', undefined)}
                    {...(state ? { state } : {})}
                    {...(isDisabled ? { isDisabled } : {})}
                />
            );
        },
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { Input } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add('Input Pin', () => <PinInput value={text('Input value', '')} onDeleteClick={() => {}} />, {
        info: {
            text: `
            ## Import
            ~~~js
            import { PinInput } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add(
        'TextArea',
        () => {
            const state = select(
                'State',
                {
                    Default: null,
                    Error: 'error',
                    Success: 'success',
                    Warning: 'warning',
                },
                null
            );
            const isDisabled = boolean('Disabled', false);

            return (
                <TextArea
                    value={text('Value', '')}
                    placeholder={text('Placeholder', 'placeholder...')}
                    bottomText={text('Bottom text', 'bottom text')}
                    topLabel={text('Top label', 'Textarea label')}
                    tooltipAction={text('tooltipAction', undefined)}
                    {...(isDisabled ? { isDisabled } : {})}
                    {...(state ? { state } : {})} // hack to hide state prop if its value is null
                />
            );
        },
        {
            info: {
                text: `
            ## Import
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
                text: `
            ## Import
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
                text: `
            ## Import
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
            return (
                <Select
                    {...(!isSearchable ? { isSearchable } : {})}
                    {...(isClearable ? { isClearable } : {})}
                    {...(isDisabled ? { isDisabled } : {})}
                    {...(withDropdownIndicator ? {} : { withDropdownIndicator })}
                    value={select('Value', {
                        None: null,
                        Hello: { value: 'hello', label: 'Hello' },
                        World: { value: 'world', label: 'World' },
                    })}
                    options={[
                        { value: 'hello', label: 'Hello' },
                        { value: 'world', label: 'World' },
                    ]}
                />
            );
        },
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { Select } from 'trezor-ui-components';
            ~~~
            *<Select> is just a styling wrapper around [react-select](https://react-select.com) component. See the [official documentation](https://react-select.com) for more information about its props and usage.*
            `,
            },
        }
    )
    .add(
        'Select (Async)',
        () => (
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
                    ].filter(
                        item => item.label.toLowerCase().search(inputValue.toLowerCase()) !== -1
                    );
                    callback(data);
                }}
            />
        ),
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { AsyncSelect } from 'trezor-ui-components';
            ~~~
            *<AsyncSelect> is just a styling wrapper around async version of [react-select](https://react-select.com) component. See the [official documentation](https://react-select.com/async) for more information about its props and usage.*
            `,
            },
        }
    );
