import { FC } from 'react';
import styled from 'styled-components';

import { Dropdown } from '@trezor/components';
import { ExtendedProps } from './definitions';
import { RequiredKey } from '@trezor/type-utils';

const StyledDropdown = styled(Dropdown)`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
`;

const StyledInner = styled.div`
    display: flex;
    overflow: hidden;
`;

type Props = RequiredKey<ExtendedProps, 'dropdownOptions'>;

/**
 * Returns component wrapped into Dropdown.
 */
export const withDropdown = (WrappedComponent: FC<Props>) => (props: Props) => (
    <StyledDropdown
        isDisabled={props.editActive}
        alignMenu="left"
        items={[
            {
                key: 'key',
                options: props.dropdownOptions.map(it => ({
                    ...it,
                    'data-test': `${props['data-test']}/dropdown/${it.key}`,
                })),
            },
        ]}
        absolutePosition
        appendTo={document.body}
    >
        <StyledInner>
            <WrappedComponent {...props} />
        </StyledInner>
    </StyledDropdown>
);
