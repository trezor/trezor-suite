import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { motion, Variants } from 'framer-motion';
import Text from '@onboarding-components/Text';
import { Translation } from '@suite-components';
import { H1, variables, Button, Image, ImageProps, useTheme } from '@trezor/components';
import useMeasure from 'react-use/lib/useMeasure';
import { transitionEase } from '@suite-config/animation';
import { useLayoutSize } from '@suite-hooks/useLayoutSize';

const BoxWrapper = styled(
    ({ variant, withImage, disablePadding, expanded, expandable, nested, ...rest }) => (
        <motion.div {...rest} />
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
    z-index: ${variables.Z_INDEX.BASE};
    cursor: ${({ expanded }) => !expanded && 'pointer'};

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding-left: ${props => (props.variant === 'large' ? '40px' : '30px')};
        padding-right: ${props => (props.variant === 'large' ? '40px' : '30px')};
        padding-bottom: ${props => (props.variant === 'large' ? '40px' : '20px')};
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-left: 20px;
        padding-right: 20px;
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

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding: 0px 0px 36px 0px;
    }
`;

const ExpandableBox = styled(motion.div)`
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
    image?: Extract<ImageProps, { image: any }>['image'];
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
    const { isMobileLayout, layoutSize } = useLayoutSize();

    const wrapperVariants = useMemo<Variants>(() => {
        let padding;

        if (variant === 'large' && !isMobileLayout) {
            if (layoutSize === 'NORMAL') {
                padding = '40px 40px 40px 40px';
            } else {
                padding = '40px 80px 40px 80px';
            }
        } else {
            padding = '20px 30px 20px 30px';
        }

        return {
            closed: {
                background: theme.BG_GREY,
                boxShadow: 'rgba(0, 0, 0, 0) 0px 2px 5px 0px',
                borderRadius: 10,
                padding: '16px 26px 16px 26px',
            },
            expanded: {
                background: theme.BG_WHITE,
                borderRadius: 16,
                padding,
            },
        };
    }, [theme, variant, isMobileLayout, layoutSize]);

    const headerVariants = useMemo<Variants>(
        () => ({
            closed: {
                opacity: 1,
            },
            expanded: {
                opacity: 0,
            },
        }),
        [],
    );

    const animationVariants = useMemo<Variants>(
        () => ({
            closed: {
                opacity: 0,
                height: 0,
            },
            expanded: {
                opacity: 1,
                height,
            },
        }),
        [height],
    );

    return (
        <BoxWrapper
            expanded={expanded}
            expandable={expandable}
            variant={variant}
            withImage={!!image}
            className={className}
            nested={nested}
            variants={expandable ? wrapperVariants : undefined}
            animate={expanded ? 'expanded' : 'closed'}
            transition={{ duration: 0.4, ease: transitionEase }}
            onClick={expandable && !expanded ? onToggle : undefined}
            data-test="@onboarding/box-animated"
            {...rest}
        >
            <BoxWrapperInner expandable={expandable}>
                {expandable && (
                    <ExpandableBox
                        variants={headerVariants}
                        animate={expanded ? 'expanded' : 'closed'}
                        transition={{ duration: 0.2, ease: 'linear' }}
                    >
                        {expandableIcon}

                        <HeadingExpandable>{heading}</HeadingExpandable>

                        <Tag>
                            <Translation id="TR_ONBOARDING_ADVANCED" />
                        </Tag>
                    </ExpandableBox>
                )}

                <motion.div
                    variants={expandable ? animationVariants : undefined}
                    animate={expanded ? 'expanded' : 'closed'}
                    transition={{ duration: 0.4, ease: transitionEase }}
                >
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
                </motion.div>
            </BoxWrapperInner>
        </BoxWrapper>
    );
};

export default Box;
export type { Props as BoxProps };
