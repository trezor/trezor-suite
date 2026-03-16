import { type ReactNode } from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';

import { SubTabsContext } from './SubTabsContext';
import { SubTabsItem } from './SubTabsItem';
import { type SubTabsSize } from './types';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';
import { Row } from '../Flex/Flex';

export const allowedSubTabsFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSubTabsFrameProps)[number]>;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    ${withFrameProps}
`;

export type SubTabsProps = AllowedFrameProps & {
    children: ReactNode;
    size?: SubTabsSize;
    activeItemId?: string;
};

const SubTabs = ({ activeItemId, size = 'medium', children, ...rest }: SubTabsProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedSubTabsFrameProps);

    return (
        <SubTabsContext.Provider value={{ activeItemId, size }}>
            <Container {...frameProps}>
                <Row alignItems="stretch" gap={spacings.xxs}>
                    {children}
                </Row>
            </Container>
        </SubTabsContext.Provider>
    );
};

SubTabs.Item = SubTabsItem;

export { SubTabs };
