import { ReactNode } from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';
import { Row } from '@trezor/components';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { SubtabsContext } from './SubtabsContext';
import { SubtabsItem } from './SubtabsItem';
import { SubtabsSize } from './types';

export const allowedSubtabsFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSubtabsFrameProps)[number]>;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    ${withFrameProps}
`;

export type SubtabsProps = AllowedFrameProps & {
    children: ReactNode;
    size?: SubtabsSize;
    activeItemId?: string;
};

const Subtabs = ({ activeItemId, size = 'medium', children, ...rest }: SubtabsProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedSubtabsFrameProps);

    return (
        <SubtabsContext.Provider value={{ activeItemId, size }}>
            <Container {...frameProps}>
                <Row alignItems="stretch" gap={spacings.xxs}>
                    {children}
                </Row>
            </Container>
        </SubtabsContext.Provider>
    );
};

Subtabs.Item = SubtabsItem;

export { Subtabs };
