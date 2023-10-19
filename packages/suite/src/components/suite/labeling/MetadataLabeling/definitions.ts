import { ReactNode } from 'react';
import { MetadataAddPayload } from 'src/types/suite/metadata';

export interface DropdownMenuItem {
    key: string;
    label: ReactNode;
    callback?: () => boolean | void;
    'data-test'?: string;
}

export interface Props {
    defaultVisibleValue?: ReactNode;
    payload: MetadataAddPayload;
    dropdownOptions?: DropdownMenuItem[];
    isDisabled?: boolean;
    // override default onSubmit logic
    onSubmit?: (value: string | undefined) => void;
    // override default behavior of metadata labeling element visible only on hover
    visible?: boolean;
}

export interface ExtendedProps extends Props {
    editActive: boolean;
    onSubmit: (value: string | undefined) => void;
    onBlur: () => void;
    'data-test': string;
}
