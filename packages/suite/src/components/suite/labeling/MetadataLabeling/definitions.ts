import { ReactNode } from 'react';

import { AccountType, Bip43Path, NetworkType } from '@suite-common/wallet-config';
import { DropdownMenuItemProps } from '@trezor/components';
import type { StaticSessionId } from '@trezor/connect';

import { MetadataAddPayload } from 'src/types/suite/metadata';

export type LabelingVariant = 'button' | 'text';

interface BaseProps {
    accountType?: AccountType;
    networkType?: NetworkType;
    path?: Bip43Path;
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
    updateFlag?: any;
    deviceStaticSessionId: StaticSessionId;
}

export interface MetadataProps extends BaseProps {
    variant: LabelingVariant;
}

export interface PrimitiveProps extends BaseProps {
    editActive: boolean;
    onSubmit: (value: string | undefined) => void;
    onClick?: () => void | undefined;
    onBlur: () => void;
    'data-testid': string;
}

export interface LabelContentProps extends PrimitiveProps {
    variant: LabelingVariant;
}
