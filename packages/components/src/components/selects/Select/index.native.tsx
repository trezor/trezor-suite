import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Platform } from 'react-native';
import RNPickerSelect, { Item, PickerProps } from 'react-native-picker-select';
import { Icon } from '../../Icon';
import colors from '../../../config/colors';

interface Props extends Omit<PickerProps, 'items' | 'placeholder'> {
    onChange: () => void;
    options: { [k: string]: Item | null };
    withDropdownIndicator?: boolean;
    isDisabled?: boolean;
    placeholder?: string;
}

const styles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.INPUT_BORDER,
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.INPUT_BORDER,
        borderRadius: 4,
        color: 'black',
        paddingRight: 30,
    },
    disabled: {
        backgroundColor: colors.SELECT_HOVER,
    },
});

const optionsToItems = (options: object) => {
    const items = Object.values(options).filter(option => option !== null);
    return items;
};

// TODO: prop `value` doesn't work
const Select = ({
    onChange,
    withDropdownIndicator = true,
    isDisabled = false,
    placeholder,
    options,
    value,
    ...rest
}: Props) => (
    <RNPickerSelect
        onValueChange={onChange}
        Icon={() => {
            return withDropdownIndicator && !isDisabled && <Icon size={14} icon="ARROW_DOWN" />;
        }}
        style={{
            iconContainer: {
                top: 16,
                right: 15,
            },
        }}
        textInputProps={{
            style: [
                Platform.OS === 'ios' ? styles.inputIOS : styles.inputAndroid,
                isDisabled ? styles.disabled : {},
            ],
            placeholderTextColor: colors.GRAY_LIGHT,
        }}
        items={optionsToItems(options)}
        placeholder={{ label: placeholder }}
        useNativeAndroidPickerStyle={false}
        disabled={isDisabled}
        value={value}
        {...rest}
    />
);

const propTypes = {
    onChange: PropTypes.func,
    withDropdownIndicator: PropTypes.bool,
    isDisabled: PropTypes.bool,
    placeholder: PropTypes.string,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    options: PropTypes.object,
    // TODO
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.object,
};

Select.propTypes = propTypes;

export { Select, Props as SelectProps };
