import { ReactNode, HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { zIndices } from '@trezor/theme';
import { H2, Icon, Image, ImageType, motionEasing, variables } from '@trezor/components';

const headerVariants = {
    closed: {
        opacity: 1,
    },
    expanded: {
        opacity: 0,
    },
};

const animationVariants = {
    closed: {
        opacity: 0,
        height: 0,
    },
    expanded: {
        opacity: 1,
        height: 'auto',
    },
};

const CardWrapper = styled(
    ({ variant, withImage, disablePadding, expanded, expandable, nested, ...rest }) => (
        <motion.div {...rest} />
    ),
)<{
    variant?: CollapsibleOnboardingCardProps['variant'];
    withImage?: boolean;
    expanded?: CollapsibleOnboardingCardProps['expanded'];
    expandable?: CollapsibleOnboardingCardProps['expandable'];
}>`
    position: relative;
    padding: ${({ variant }) => (variant === 'large' ? '40px 80px' : '20px 30px')};
    width: ${({ variant }) => (variant === 'large' ? '100%' : 'auto')};
    border-radius: 16px;
    background: ${({ theme }) => theme.BG_WHITE};
    z-index: ${zIndices.base};
    cursor: ${({ expanded }) => !expanded && 'pointer'};

    ${({ expandable, variant }) =>
        !expandable &&
        css`
            ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                padding-left: ${variant === 'large' ? '40px' : '30px'};
                padding-right: ${variant === 'large' ? '40px' : '30px'};
                padding-bottom: ${variant === 'large' ? '40px' : '20px'};
            }

            ${variables.SCREEN_QUERY.MOBILE} {
                padding-left: 20px;
                padding-right: 20px;
            }
        `}

    ${({ expanded, expandable, theme }) =>
        expandable &&
        !expanded &&
        css`
            background: ${theme.BG_GREY};
            box-shadow: rgb(0 0 0 / 0%) 0 2px 5px 0;
            border-radius: 10px;
            padding: 16px 26px;
        `}

    ${({ expanded, expandable, theme, variant }) =>
        expandable &&
        expanded &&
        css`
            background: ${theme.BG_WHITE};
            border-radius: 16px;
            padding: ${variant === 'large' ? '40px' : '20px 30px'};
        `}

    ${({ nested, theme }) =>
        nested
            ? css`
                  padding: 0;
              `
            : css`
                  box-shadow: 0 2px 5px 0 ${theme.BOX_SHADOW_BLACK_20};
              `}
              
    ${({ withImage }) =>
        withImage &&
        css`
            margin-top: 50px;
            padding-top: 80px;
        `}

    ${({ variant }) =>
        variant === 'small' &&
        css`
            max-width: 550px;
        `}
`;

const CardWrapperInner = styled.div<{ expandable: boolean }>`
    overflow: ${({ expandable }) => expandable && 'hidden'};
`;

const Text = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const CardImageWrapper = styled.div`
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

const Heading = styled(H2)<{ withDescription?: boolean }>`
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: ${({ withDescription }) => (withDescription ? '16px' : '36px')};
    text-align: center;
`;

const Description = styled.div<{ hasChildren?: boolean }>`
    padding: 0 60px 36px;
    text-align: center;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        padding: 0 0 36px;
    }
`;

const CollapsibleCardInner = styled(motion.div)`
    text-align: left;
    display: flex;
    align-items: center;
    padding: 0 6px;
`;

const HeadingExpandable = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    flex: 1;
`;

const Tag = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    letter-spacing: 0.2px;
`;

const CloseIcon = styled(Icon)`
    position: absolute;
    top: 24px;
    right: 24px;
    background: transparent;
`;

export interface CollapsibleOnboardingCardProps extends HTMLAttributes<HTMLDivElement> {
    image?: ImageType;
    variant?: 'small' | 'large';
    expandable?: boolean;
    expanded?: boolean;
    nested?: boolean;
    onToggle?: () => void;
    expandableIcon?: ReactNode;
    heading?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    tag?: ReactNode;
}

export const CollapsibleOnboardingCard = ({
    heading,
    description,
    image,
    children,
    variant = 'large',
    expanded = true,
    expandable = false,
    expandableIcon,
    nested,
    tag,
    onCanPlayThroughCapture,
    onToggle = () => undefined,
    ...rest
}: CollapsibleOnboardingCardProps) => (
    <CardWrapper
        expanded={expanded}
        expandable={expandable}
        variant={variant}
        withImage={!!image}
        nested={nested}
        animate={expanded ? 'expanded' : 'closed'}
        transition={{ duration: 0.4, ease: motionEasing.transition }}
        onClick={expandable && !expanded ? onToggle : undefined}
        data-test="@components/collapsible-box"
        {...rest}
    >
        <CardWrapperInner expandable={expandable}>
            {expandable && (
                <CollapsibleCardInner
                    variants={headerVariants}
                    animate={expanded ? 'expanded' : 'closed'}
                    transition={{ duration: 0.2, ease: 'linear' }}
                >
                    {expandableIcon}

                    <HeadingExpandable>{heading}</HeadingExpandable>

                    {tag && <Tag>{tag}</Tag>}
                </CollapsibleCardInner>
            )}

            <motion.div
                initial={false} // Prevents animation on mount when expanded === false
                variants={expandable ? animationVariants : undefined}
                animate={expanded ? 'expanded' : 'closed'}
                transition={{ duration: 0.4, ease: motionEasing.transition }}
            >
                {expandable && expanded && <CloseIcon icon="CROSS" size={22} onClick={onToggle} />}

                {heading && <Heading withDescription={!!description}>{heading}</Heading>}

                {description && (
                    <Description hasChildren={!!children}>
                        <Text>{description}</Text>
                    </Description>
                )}

                {image && (
                    <CardImageWrapper>
                        <Image width={100} height={100} image={image} />
                    </CardImageWrapper>
                )}

                <ChildrenWrapper>{children}</ChildrenWrapper>
            </motion.div>
        </CardWrapperInner>
    </CardWrapper>
);
