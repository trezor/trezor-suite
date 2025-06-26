import { useRef } from 'react';

import {
    BottomSheetSearchInput,
    BottomSheetSearchInputRef,
    SearchInputWithCancel,
} from '@suite-native/atoms';

const noOp = () => {};

export type BottomSheetSearchInputProps = React.ComponentProps<typeof BottomSheetSearchInput>;

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
