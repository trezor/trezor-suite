import React, { Component } from 'react';
import { View } from 'react-native';
import { Select } from '@trezor/components';
import styled from 'styled-components/native';
import Typography from './views/Typography';
import Form from './views/Form';
import Notification from './views/Notification';
import Buttons from './views/Button';
import Other from './views/Other';

const views: any = {
    typography: Typography,
    form: Form,
    notification: Notification,
    buttons: Buttons,
    other: Other,
};

const SelectWrapper = styled.View`
    padding: 10px;
`;

export default class Components extends Component {
    state = {
        option: 'other',
    };

    render() {
        const options: any = {
            None: null,
            Typography: { value: 'typography', label: 'Typography' },
            Form: { value: 'form', label: 'Form' },
            Notification: { value: 'notification', label: 'Notification' },
            Buttons: { value: 'buttons', label: 'Buttons' },
            Other: { value: 'other', label: 'Other' },
        };
        const C = views[this.state.option || 'typography'];

        return (
            <View>
                <SelectWrapper>
                    <Select
                        isSearchable
                        isClearable
                        withDropdownIndicator
                        options={options}
                        onChange={value => {
                            this.setState({
                                option: value,
                            });
                        }}
                        placeholder="Choose section"
                    />
                </SelectWrapper>
                <C />
            </View>
        );
    }
}
