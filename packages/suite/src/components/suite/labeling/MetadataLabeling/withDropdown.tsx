import { FC, useRef } from 'react';

import { Menu, Popover, PopoverRef } from '@trezor/components';
import { RequiredKey } from '@trezor/type-utils';

import { ExtendedProps } from './definitions';

type Props = RequiredKey<ExtendedProps, 'dropdownOptions'>;

/**
 * Returns component wrapped into Dropdown.
 * ONLY for the MetadataLabeling component.
 */
export const withDropdown = (WrappedComponent: FC<ExtendedProps>) => (props: Props) => {
    const popoverRef = useRef<PopoverRef>(null);

    return (
        <Popover
            ref={popoverRef}
            placement={{
                position: 'bottom',
                alignment: 'start',
            }}
            content={
                <Menu
                    items={props.dropdownOptions.map(it => ({
                        ...it,
                        'data-testid': `${props['data-testid']}/dropdown/${it['data-testid']}`, // hack: this shall be refactored somehow
                    }))}
                    onClose={popoverRef.current?.close}
                />
            }
        >
            <WrappedComponent {...props} />
        </Popover>
    );
};
