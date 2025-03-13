import { useResponsiveContext } from './ResponsiveContext';

export type ContainerType = 'content' | 'sidebar';

export type UseConditionalRenderProps = {
    container: ContainerType;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
};

export type ConditionalRenderProps = UseConditionalRenderProps & {
    children: React.ReactNode;
};

const map = {
    content: 'contentWidth',
    sidebar: 'sidebarWidth',
} as const satisfies Record<ContainerType, string>;

export const useConditionalRender = ({
    container,
    minWidth,
    maxWidth,
    width,
}: UseConditionalRenderProps) => {
    const responsiveContext = useResponsiveContext();
    const containerSize = responsiveContext[map[container]];

    const satisfiesMinWidth = containerSize && minWidth ? containerSize > minWidth : true;
    const satisfiesMaxWidth = containerSize && maxWidth ? containerSize <= maxWidth : true;
    const satisfiesWidth = containerSize && width ? containerSize === width : true;

    return satisfiesMinWidth && satisfiesMaxWidth && satisfiesWidth;
};

export const ConditionalRender = ({ children, ...rest }: ConditionalRenderProps) => {
    const isVisible = useConditionalRender(rest);

    return isVisible ? children : null;
};
