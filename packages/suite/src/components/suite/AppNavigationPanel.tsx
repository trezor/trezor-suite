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
import { H1, variables } from '@trezor/components';
import { MAX_WIDTH, MAX_WIDTH_WALLET_CONTENT } from 'src/constants/suite/layout';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    padding: 24px 32px 10px;
    z-index: ${variables.Z_INDEX.PAGE_HEADER};

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 24px 16px 20px;
    }
`;

const Content = styled.div<Pick<AppNavigationPanelProps, 'maxWidth'>>`
    display: flex;
    width: 100%;
    max-width: ${props => (props.maxWidth === 'default' ? MAX_WIDTH : MAX_WIDTH_WALLET_CONTENT)};
    flex-direction: column;
`;

const BasicInfo = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled(H1)`
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

const Delimeter = styled.div``;

interface AppNavigationPanelProps {
    title: ReactNode;
    titleContent?: (isAppNavigationPanelInView: boolean) => ReactNode | undefined;
    maxWidth: 'small' | 'default';
    navigation?: ReactElement<{ inView: boolean }>;
    children?: ReactNode;
    className?: string;
}

export const AppNavigationPanel = ({
    title,
    titleContent,
    maxWidth,
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
                <Content maxWidth={maxWidth}>
                    <BasicInfo>
                        <TitleRow>
                            <Title noMargin>{title}</Title>
                            <Aside data-test="@app/navigation/aside">
                                {titleContent?.(inView)}
                            </Aside>
                        </TitleRow>
                        {children && <Row>{children}</Row>}
                    </BasicInfo>
                </Content>
            </Wrapper>
            {isValidElement(navigation) && cloneElement(navigation, { inView })}
            <Delimeter />
        </>
    );
};
