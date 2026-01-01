import { MouseEvent, useState } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { Icon, Link, Text, TextProps } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';

const IconWrapper = styled.div`
    display: none;
    padding: ${spacingsPx.xxxs};
    border-radius: ${borders.radii.xxxs};
    margin-left: ${spacingsPx.xxs};
    background-color: ${({ theme }) => theme.iconSubdued};
    height: 16px;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 0.7;
    }
`;

const onHoverTextOverflowContainerHover = css`
    border-radius: ${borders.radii.xxxs};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    outline: ${borders.widths.large} solid ${({ theme }) => theme.backgroundSurfaceElevation2};
    z-index: 3;

    ${IconWrapper} {
        display: flex;
    }
`;

const TextOverflowContainer = styled.div<{ $shouldAllowCopy?: boolean }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    overflow: hidden;
    cursor: ${({ $shouldAllowCopy }) => ($shouldAllowCopy ? 'pointer' : 'cursor')};
    user-select: none;

    ${({ $shouldAllowCopy }) =>
        $shouldAllowCopy &&
        css`
            @media (hover: none) {
                ${onHoverTextOverflowContainerHover}
            }

            &:hover,
            &:focus {
                ${onHoverTextOverflowContainerHover}
            }
        `}
`;

interface TokenAddressRowProps {
    explorerUrl?: string;
    address: string | null;
    shouldAllowCopy?: boolean;
    typographyStyle?: TextProps['typographyStyle'];
    variant?: TextProps['variant'];
    onCopy?: () => void;
    showStart?: number;
    showEnd?: number;
}

// TODO: this component is little bit copy/paste of IOAddress component, please check it
export const AddressRow = ({
    address,
    explorerUrl,
    shouldAllowCopy = true,
    typographyStyle = 'label',
    variant = 'default',
    showStart = 6,
    showEnd = 4,
    onCopy,
}: TokenAddressRowProps) => {
    const [isClicked, setIsClicked] = useState(false);
    const theme = useTheme();

    if (!address) return null;

    const copy = (event: MouseEvent) => {
        setIsClicked(true);
        event.stopPropagation();
        onCopy?.();
    };

    const shortenedTokenAddress = `${address.slice(0, showStart)}...${address.slice(address.length - showEnd, address.length)}`;

    return (
        <Text typographyStyle={typographyStyle} variant={variant}>
            <TextOverflowContainer
                onMouseLeave={() => setIsClicked(false)}
                data-testid="@tx-detail/txid-value"
                id={address}
                $shouldAllowCopy={shouldAllowCopy}
            >
                <Text textWrap="nowrap">{shortenedTokenAddress}</Text>
                {shouldAllowCopy ? (
                    <IconWrapper onClick={copy}>
                        <Icon
                            pointerEvents="none"
                            name={isClicked ? 'check' : 'copy'}
                            size={12}
                            color={theme.iconOnPrimary}
                        />
                    </IconWrapper>
                ) : null}
                {explorerUrl ? (
                    <IconWrapper>
                        <Link href={explorerUrl}>
                            <Icon name="arrowUpRight" size={12} color={theme.iconOnPrimary} />
                        </Link>
                    </IconWrapper>
                ) : null}
            </TextOverflowContainer>
        </Text>
    );
};
