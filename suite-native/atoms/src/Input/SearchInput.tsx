import { useRef } from 'react';
import { type TextInput } from 'react-native';

import { type SurfaceElevation } from '../types';
import { BaseSearchInput } from './BaseSearchInput';

export type SearchInputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    autoFocus?: boolean;
    isDisabled?: boolean;
    elevation?: SurfaceElevation;
    onFocus?: () => void;
    onBlur?: () => void;
};

export const SearchInput = ({
    onChange,
    placeholder,
    maxLength,
    autoFocus,
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
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            isDisabled={isDisabled}
            elevation={elevation}
            onFocus={onFocus}
            onBlur={onBlur}
            ref={searchInputRef}
        />
    );
};
