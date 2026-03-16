import { useRef } from 'react';

import {
    BottomSheetSearchInput,
    type BottomSheetSearchInputProps,
    type BottomSheetSearchInputRef,
    SearchInputWithCancel,
} from '@suite-native/atoms';

const noOp = () => {};

export const BottomSheetSearchInputWithCancel = ({
    onFocus = noOp,
    onBlur = noOp,
    onChange,
    placeholder,
    ...props
}: BottomSheetSearchInputProps) => {
    const inputRef = useRef<BottomSheetSearchInputRef>(null);

    return (
        <SearchInputWithCancel<BottomSheetSearchInputRef>
            SearchComponent={BottomSheetSearchInput}
            searchRef={inputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={onChange}
            value={props.value ?? ''}
            placeholder={placeholder}
            {...props}
        />
    );
};
