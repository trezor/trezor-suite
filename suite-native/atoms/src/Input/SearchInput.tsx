import { useRef } from 'react';
import { type TextInput } from 'react-native';

import { type SurfaceElevation } from '../types';
import { BaseSearchInput } from './BaseSearchInput';

export type SearchInputProps = {
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
}: SearchInputProps) => {
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
