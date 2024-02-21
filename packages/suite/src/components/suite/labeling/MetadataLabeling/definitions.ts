import { ReactNode } from 'react';
import { DropdownMenuItemProps } from '@trezor/components/libDev';
import { MetadataAddPayload } from 'src/types/suite/metadata';

export interface Props {
    defaultVisibleValue?: ReactNode;
    defaultEditableValue?: string;
    payload: MetadataAddPayload;
    dropdownOptions?: DropdownMenuItemProps[];
    isDisabled?: boolean;
    // override default onSubmit logic
    onSubmit?: (value: string | undefined) => void;
    // override default behavior of metadata labeling element visible only on hover
    visible?: boolean;
    placeholder?: string;
}

export interface ExtendedProps extends Props {
    editActive: boolean;
    onSubmit: (value: string | undefined) => void;
    onBlur: () => void;
    'data-test-id': string;
}
