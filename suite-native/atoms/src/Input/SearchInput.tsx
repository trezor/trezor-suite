import { useRef } from 'react';
import { type TextInput } from 'react-native';

import { BaseSearchInput } from './BaseSearchInput';

export type SearchInputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    autoFocus?: boolean;
};

export const SearchInput = ({ onChange, placeholder, maxLength, autoFocus }: SearchInputProps) => {
    const searchInputRef = useRef<TextInput>(null);

    return (
        <BaseSearchInput
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            ref={searchInputRef}
        />
    );
};
