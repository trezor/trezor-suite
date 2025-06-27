import { useRef } from 'react';
import { TextInput } from 'react-native';

import { SurfaceElevation } from '../types';
import { BaseSearchInput } from './BaseSearchInput';

type InputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    isDisabled?: boolean;
    maxLength?: number;
    elevation?: SurfaceElevation;
    onFocus?: () => void;
    onBlur?: () => void;
};

export const SearchInput = ({
    onChange,
    placeholder,
    maxLength,
    isDisabled = false,
    elevation = '0',
    onFocus,
    onBlur,
}: InputProps) => {
    const searchInputRef = useRef<TextInput>(null);

    return (
        <BaseSearchInput
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            isDisabled={isDisabled}
            elevation={elevation}
            onFocus={onFocus}
            onBlur={onBlur}
            ref={searchInputRef}
        />
    );
};
