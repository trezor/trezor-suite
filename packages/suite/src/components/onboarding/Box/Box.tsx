import React from 'react';
import styled, { css } from 'styled-components';
import { animated, useSpring } from 'react-spring';
import Text from '@onboarding-components/Text';
import { Image, ImageProps, Translation } from '@suite-components';
import { H1, variables, Button, useTheme } from '@trezor/components';
import useMeasure from 'react-use/lib/useMeasure';

const BoxWrapper = styled(
    ({ variant, withImage, disablePadding, expanded, expandable, nested, ...rest }) => (
        <animated.div {...rest} />
    ),
)<{
    variant?: Props['variant'];
    withImage?: boolean;
    expanded?: Props['expanded'];
    expandable?: Props['expandable'];
}>`
    position: relative;
    padding: ${props => (props.variant === 'large' ? '40px 80px' : '20px 30px')};
    width: ${props => (props.variant === 'large' ? '100%' : 'auto')};
    border-radius: 16px;
    background: ${props => props.theme.BG_WHITE};

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding-left: ${props => (props.variant === 'large' ? '40px' : '30px')};
        padding-right: ${props => (props.variant === 'large' ? '40px' : '30px')};
        padding-bottom: ${props => (props.variant === 'large' && props.expanded ? '40px' : '20px')};
    }

    ${props =>
        !props.nested &&
        css`
            box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
        `}

    ${props =>
        props.withImage &&
        css`
            margin-top: 50px;
            padding-top: 80px;
        `}
    ${props =>
        props.variant === 'small' &&
        css`
            max-width: 550px;
        `}
    ${props =>
        props.expandable &&
        (props.expanded
            ? css`
                  padding-top: 57px;
              `
            : css`
                  background: ${props.theme.BG_GREY};
                  box-shadow: none;
                  border-radius: 10px;
                  cursor: pointer;
                  padding: 22px 25px 19px 36px;
              `)}
`;

const BoxWrapperInner = styled.div<{ expandable: boolean }>`
    ${props =>
        props.expandable &&
        css`
            overflow: hidden;
        `}
`;

const BoxImageWrapper = styled.div`
    width: 100px;
    height: 100px;
    position: absolute;
    z-index: 1;
    margin-left: auto;
    margin-right: auto;
    top: -50px;
    left: 0;
    right: 0;
`;

const ChildrenWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Heading = styled(H1)<{ withDescription?: boolean }>`
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: ${props => (props.withDescription ? '16px' : '36px')};
    text-align: center;
`;

const Description = styled.div<{ hasChildren?: boolean }>`
    padding: 0px 60px 36px 60px;
    text-align: center;

    ${props =>
        props.hasChildren &&
        css`
            /* border-bottom: 1px solid ${props => props.theme.STROKE_GREY}; */
            /* margin-bottom: 32px; */
        `}

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding: 0px 0px 36px 0px;
    }
`;

const ExpandableBox = styled(animated.div)`
    text-align: left;
    display: flex;
    align-items: center;
    padding: 0 6px;
`;

const HeadingExpandable = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    flex: 1;
`;

const Tag = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    letter-spacing: 0.2px;
`;

const CloseButton = styled(Button)`
    position: absolute;
    top: 16px;
    right: 16px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    image?: ImageProps['image'];
    variant?: 'small' | 'large';
    expandable?: boolean;
    expanded?: boolean;
    nested?: boolean;
    onToggle?: () => void;
    expandableIcon?: React.ReactNode;
    heading?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
}

const Box = ({
    heading,
    description,
    image,
    children,
    className,
    variant = 'large',
    expanded = true,
    expandable = false,
    expandableIcon,
    nested,
    onToggle = () => undefined,
    ...rest
}: Props) => {
    const theme = useTheme();
    const [heightRef, { height }] = useMeasure<HTMLDivElement>();
    const springExpandableBox = useSpring({
        from: { opacity: 0 },
        to: { background: expanded ? theme.BG_WHITE : theme.BG_GREY, opacity: 1 },
    });
    const expandedStyles = useSpring({
        from: { opacity: 0, height: 0 },
        to: {
            opacity: expandable && expanded ? 1 : 0,
            height: expandable && expanded ? height + 0 : 0,
        },
    });
    return (
        <BoxWrapper
            expanded={expanded}
            expandable={expandable}
            variant={variant}
            withImage={!!image}
            className={className}
            style={springExpandableBox}
            nested={nested}
            onClick={expandable && !expanded ? onToggle : undefined}
            {...rest}
        >
            <BoxWrapperInner expandable={expandable}>
                {expandable && !expanded && (
                    <ExpandableBox>
                        {expandableIcon}
                        <HeadingExpandable>{heading}</HeadingExpandable>
                        <Tag>
                            <Translation id="TR_ONBOARDING_ADVANCED" />
                        </Tag>
                    </ExpandableBox>
                )}
                <animated.div style={expandable ? expandedStyles : {}}>
                    <div ref={heightRef}>
                        {expandable && expanded && (
                            <CloseButton variant="tertiary" onClick={() => onToggle()}>
                                <Translation id="TR_CLOSE" />
                            </CloseButton>
                        )}
                        {heading && <Heading withDescription={!!description}>{heading}</Heading>}
                        {description && (
                            <Description hasChildren={!!children}>
                                <Text>{description}</Text>
                            </Description>
                        )}
                        {image && (
                            <BoxImageWrapper>
                                <Image width={100} height={100} image={image} />
                            </BoxImageWrapper>
                        )}
                        <ChildrenWrapper>{children}</ChildrenWrapper>
                    </div>
                </animated.div>
            </BoxWrapperInner>
        </BoxWrapper>
    );
};

export default Box;
export type { Props as BoxProps };
