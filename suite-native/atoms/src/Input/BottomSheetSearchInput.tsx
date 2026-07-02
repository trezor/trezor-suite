import { type Ref, forwardRef } from 'react';
import { type TextInput } from 'react-native';

import { SearchInput, type SearchInputProps } from './SearchInput';

export type BottomSheetSearchInputProps = SearchInputProps;
export type BottomSheetSearchInputRef = TextInput | null;

/**
 * `SearchInput` preset that renders a `BottomSheetTextInput` so the field works
 * correctly inside a `@gorhom/bottom-sheet` (keyboard avoidance, gesture handling).
 */
export const BottomSheetSearchInput = forwardRef<
    BottomSheetSearchInputRef,
    BottomSheetSearchInputProps
>((props, ref) => <SearchInput ref={ref as Ref<TextInput>} {...props} isBottomSheetInput />);
