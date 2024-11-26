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
    tokenExplorerUrl?: string;
    tokenContractAddress: string | null;
    shouldAllowCopy?: boolean;
    typographyStyle?: TextProps['typographyStyle'];
    variant?: TextProps['variant'];
    onCopy: () => void;
}

// This is needed because icon interferes with pointer events of Select
// eslint-disable-next-line local-rules/no-override-ds-component
const IconWithNoPointer = styled(Icon)`
    pointer-events: none;
`;

// TODO: this component is little bit copy/paste of IOAddress component, please check it
export const TokenAddressRow = ({
    tokenContractAddress,
    tokenExplorerUrl,
    shouldAllowCopy = true,
    typographyStyle = 'label',
    variant = 'default',
    onCopy,
}: TokenAddressRowProps) => {
    const [isClicked, setIsClicked] = useState(false);
    const theme = useTheme();

    if (!tokenContractAddress) return null;

    const copy = (event: MouseEvent) => {
        setIsClicked(true);
        event.stopPropagation();
        onCopy();
    };

    const shortenedTokenAddress = `${tokenContractAddress.slice(0, 6)}...${tokenContractAddress.slice(-4)}`;

    return (
        <Text typographyStyle={typographyStyle} variant={variant}>
            <TextOverflowContainer
                onMouseLeave={() => setIsClicked(false)}
                data-testid="@tx-detail/txid-value"
                id={tokenContractAddress}
                $shouldAllowCopy={shouldAllowCopy}
            >
                <Text textWrap="nowrap">{shortenedTokenAddress}</Text>
                {shouldAllowCopy ? (
                    <IconWrapper onClick={copy}>
                        <IconWithNoPointer
                            name={isClicked ? 'check' : 'copy'}
                            size={12}
                            color={theme.iconOnPrimary}
                        />
                    </IconWrapper>
                ) : null}
                {tokenExplorerUrl ? (
                    <IconWrapper>
                        <Link
                            typographyStyle="label"
                            variant="nostyle"
                            href={tokenExplorerUrl}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                        >
                            <IconWithNoPointer
                                name="arrowUpRight"
                                size={12}
                                color={theme.iconOnPrimary}
                            />
                        </Link>
                    </IconWrapper>
                ) : null}
            </TextOverflowContainer>
        </Text>
    );
};
