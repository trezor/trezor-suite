import { SpacingValues } from '@trezor/theme';
import styled from 'styled-components';
import { FrameProps, TransientFrameProps, withFrameProps } from '../common/frameProps';
import { makePropsTransient } from '../../utils/transientProps';

export const flexDirection = ['column-reverse', 'column', 'row-reverse', 'row'] as const;

export const flexJustifyContent = [
    'center',
    'end',
    'flex-end',
    'flex-start',
    'left',
    'right',
    'space-around',
    'space-between',
    'space-evenly',
    'start',
    'stretch',
] as const;

export const flexAlignItems = [
    'baseline',
    'center',
    'end',
    'first baseline',
    'flex-end',
    'flex-start',
    'last baseline',
    'self-end',
    'self-start',
    'start',
    'stretch',
] as const;

export type FlexDirection = (typeof flexDirection)[number];
export type FlexJustifyContent = (typeof flexJustifyContent)[number];
export type FlexAlignItems = (typeof flexAlignItems)[number];

const Container = styled.div<
    TransientFrameProps & {
        $gap: SpacingValues;
        $justifyContent: FlexJustifyContent;
        $alignItems: FlexAlignItems;
        $direction: FlexDirection;
    }
>`
    display: flex;
    flex-direction: ${({ $direction }) => $direction};
    gap: ${({ $gap }) => $gap}px;
    justify-content: ${({ $justifyContent }) => $justifyContent};
    align-items: ${({ $alignItems }) => $alignItems};

    ${withFrameProps}
`;

export type FlexProps = FrameProps & {
    gap?: SpacingValues;
    justifyContent?: FlexJustifyContent;
    alignItems?: FlexAlignItems;
    children: React.ReactNode;
    direction?: FlexDirection;
};

export const Flex = ({
    gap = 0,
    justifyContent = 'flex-start',
    alignItems = 'center',
    children,
    direction = 'row',
    margin,
}: FlexProps) => {
    const frameProps = {
        margin,
    };

    return (
        <Container
            $gap={gap}
            $justifyContent={justifyContent}
            $alignItems={alignItems}
            $direction={direction}
            {...makePropsTransient(frameProps)}
        >
            {children}
        </Container>
    );
};

export const Rows = (props: FlexProps) => <Flex {...props} direction="column" />;
export const Columns = (props: FlexProps) => <Flex {...props} direction="row" />;
