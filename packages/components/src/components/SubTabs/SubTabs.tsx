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
import { SubTabsContext } from './SubTabsContext';
import { SubTabsItem } from './SubTabsItem';
import { SubTabsSize } from './types';

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
