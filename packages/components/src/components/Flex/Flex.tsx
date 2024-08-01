import { SpacingValues } from '@trezor/theme';
import styled from 'styled-components';
import { FrameProps, withFrameProps } from '../common/frameProps';
import { makePropsTransient, TransientProps } from '../../utils/transientProps';

export const allowedFrameProps: (keyof FrameProps)[] = ['margin', 'width', 'height'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedFrameProps)[number]>;

export const flexDirection = ['column', 'row'] as const;
export const flexWrap = ['nowrap', 'wrap', 'wrap-reverse'] as const;

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
export type Flex = string | number;
export type FlexWrap = (typeof flexWrap)[number];

const Container = styled.div<
    TransientProps<AllowedFrameProps> & {
        $gap: SpacingValues;
        $justifyContent: FlexJustifyContent;
        $alignItems: FlexAlignItems;
        $direction: FlexDirection;
        $flex: Flex;
        $flexWrap: FlexWrap;
        $isReversed: boolean;
    }
>`
    display: flex;
    flex-flow: ${({ $direction, $isReversed, $flexWrap }) =>
        `${$direction}${$isReversed === true ? '-reverse' : ''} ${$flexWrap}`};
    flex: ${({ $flex }) => $flex};
    gap: ${({ $gap }) => $gap}px;
    justify-content: ${({ $justifyContent }) => $justifyContent};
    align-items: ${({ $alignItems }) => $alignItems};

    ${withFrameProps}
`;

export type FlexProps = AllowedFrameProps & {
    gap?: SpacingValues;
    justifyContent?: FlexJustifyContent;
    alignItems?: FlexAlignItems;
    children: React.ReactNode;
    direction?: FlexDirection;
    flex?: Flex;
    flexWrap?: FlexWrap;
    isReversed?: boolean;
    className?: string;
};

const Flex = ({
    gap = 0,
    justifyContent = 'flex-start',
    alignItems = 'center',
    children,
    direction = 'row',
    margin,
    flex = 'initial',
    flexWrap = 'nowrap',
    isReversed = false,
    className,
    width,
    height,
}: FlexProps) => {
    const frameProps = {
        margin,
        width,
        height,
    };

    return (
        <Container
            className={className}
            $gap={gap}
            $justifyContent={justifyContent}
            $alignItems={alignItems}
            $direction={direction}
            $flex={flex}
            $flexWrap={flexWrap}
            $isReversed={isReversed}
            {...makePropsTransient(frameProps)}
        >
            {children}
        </Container>
    );
};

export const Column = (props: FlexProps) => <Flex {...props} direction="column" />;
export const Row = (props: FlexProps) => <Flex {...props} direction="row" />;
