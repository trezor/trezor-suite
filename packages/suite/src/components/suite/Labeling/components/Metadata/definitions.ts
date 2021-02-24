import { MetadataAddPayload } from '@suite-types/metadata';

export interface DropdownMenuItem {
    key: string;
    label: React.ReactNode;
    callback?: () => boolean | void;
    'data-test'?: string;
}

export interface Props {
    defaultVisibleValue?: React.ReactNode;
    payload: MetadataAddPayload;
    dropdownOptions?: DropdownMenuItem[];
    isDisabled?: boolean;
}

export interface ExtendedProps extends Props {
    editActive: boolean;
    onSubmit: (value: string | undefined | null) => void;
    onBlur: () => void;
    'data-test': string;
}
