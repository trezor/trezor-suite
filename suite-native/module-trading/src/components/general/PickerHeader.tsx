import { ReactNode } from 'react';

import { HStack, SearchInput, Text, VStack } from '@suite-native/atoms';

type PickerHeaderSearchInputProps = {
    onSearchInputChange: (value: string) => void;
    searchInputPlaceholder?: string;
    isSearchInputDisabled?: boolean;
    maxSearchInputLength?: number;
};

export type PickerHeaderProps = {
    title: ReactNode;
    children?: ReactNode;
} & (
    | { isSearchInputVisible?: false }
    | ({ isSearchInputVisible: true } & PickerHeaderSearchInputProps)
);

const PickerHeaderSearchInput = ({
    onSearchInputChange,
    searchInputPlaceholder,
    isSearchInputDisabled,
    maxSearchInputLength,
}: PickerHeaderSearchInputProps) => (
    <SearchInput
        onChange={onSearchInputChange}
        maxLength={maxSearchInputLength}
        placeholder={searchInputPlaceholder}
        isDisabled={isSearchInputDisabled}
    />
);

export const PickerHeader = ({
    title,
    isSearchInputVisible,
    children,
    ...searchInputProps
}: PickerHeaderProps) => (
    <VStack spacing="sp16">
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="titleMedium" textAlign="left">
                {title}
            </Text>
            {children}
        </HStack>
        {isSearchInputVisible && (
            <PickerHeaderSearchInput {...(searchInputProps as PickerHeaderSearchInputProps)} />
        )}
    </VStack>
);
