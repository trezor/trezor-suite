import {
    useEffect,
    useState,
    useRef,
    ReactNode,
    ReactElement,
    isValidElement,
    cloneElement,
} from 'react';
import styled from 'styled-components';
import { H2, variables } from '@trezor/components';
import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { zIndices } from '@trezor/theme';
import { breakpointMediaQueries } from '@trezor/styles';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    padding: 24px ${HORIZONTAL_LAYOUT_PADDINGS} 10px;
    z-index: ${zIndices.pageHeader};

    ${breakpointMediaQueries.below_lg} {
        padding-bottom: 20px;
    }
`;

const Content = styled.div`
    display: flex;
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    flex-direction: column;
`;

const BasicInfo = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled(H2)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    white-space: nowrap;
    overflow: hidden;
`;

const Aside = styled.div`
    display: flex;

    & > * + * {
        margin-left: 10px;
    }
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    position: relative;
`;

const TitleRow = styled(Row)`
    justify-content: space-between;
    margin-bottom: 6px;
`;

const Delimiter = styled.div``;

interface AppNavigationPanelProps {
    title: ReactNode;
    titleContent?: (isAppNavigationPanelInView: boolean) => ReactNode | undefined;
    navigation?: ReactElement<{ inView: boolean }>;
    children?: ReactNode;
    className?: string;
}

export const AppNavigationPanel = ({
    title,
    titleContent,
    navigation,
    className,
    children,
}: AppNavigationPanelProps) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const { current } = ref;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (current) {
                    setInView(entry.isIntersecting);
                }
            },
            { threshold: 0.1 },
        );

        if (current) {
            observer.observe(current);
        }

        return () => {
            if (current) observer.unobserve(current);
        };
    }, [ref]);

    return (
        <>
            <Wrapper ref={ref} className={className}>
                <Content>
                    <BasicInfo>
                        <TitleRow>
                            <Title>{title}</Title>
                            <Aside data-test-id="@app/navigation/aside">
                                {titleContent?.(inView)}
                            </Aside>
                        </TitleRow>
                        {children && <Row>{children}</Row>}
                    </BasicInfo>
                </Content>
            </Wrapper>
            {isValidElement(navigation) && cloneElement(navigation, { inView })}
            <Delimiter />
        </>
    );
};
