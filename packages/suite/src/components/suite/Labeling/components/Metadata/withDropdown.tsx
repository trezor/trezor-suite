import React from 'react';
import styled from 'styled-components';

import { Dropdown } from '@trezor/components';
import { ExtendedProps } from './definitions';
import { RequiredKey } from '@suite/types/utils';

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
export const withDropdown = (WrappedComponent: React.FC<Props>) => (props: Props) => {
    return (
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
};
