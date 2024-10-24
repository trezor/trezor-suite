import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { Icon, Link, Paragraph, TextProps } from '@trezor/components';
import { useMemo, useState } from 'react';
import { copyToClipboard } from '@trezor/dom-utils';
import styled, { css, useTheme } from 'styled-components';

const IconWrapper = styled.div`
    display: none;
    padding: 1px;
    border-radius: 2px;
    margin-left: 4px;
    background-color: ${({ theme }) => theme.iconSubdued};
    height: 14px;

    &:hover {
        opacity: 0.7;
    }
`;

const onHoverTextOverflowContainerHover = css`
    border-radius: 2px;
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    outline: 4px solid ${({ theme }) => theme.backgroundSurfaceElevation2};
    z-index: 3;

    ${IconWrapper} {
        display: block;
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

const SpanTextStart = styled.span`
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface TokenAddressProps {
    tokenExplorerUrl?: string;
    tokenContractAddress: string;
    shouldAllowCopy?: boolean;
    typographyStyle?: TextProps['typographyStyle'];
    variant?: TextProps['variant'];
    onCopy: () => void;
}

export const TokenAddress = ({
    tokenContractAddress,
    tokenExplorerUrl,
    shouldAllowCopy = true,
    typographyStyle = 'label',
    variant = 'default',
    onCopy,
}: TokenAddressProps) => {
    const [isClicked, setIsClicked] = useState(false);
    const theme = useTheme();

    const copy = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy();
    };

    const shortenAddress = useMemo(() => {
        return `${tokenContractAddress.slice(0, 6)}...${tokenContractAddress.slice(-4)}`;
    }, [tokenContractAddress]);

    // This is needed because icon interferes with pointer events of Select
    const IconWithNoPointer = styled(Icon)`
        pointer-events: none;
    `;

    // HiddenPlaceholder disableKeepingWidth: it isn't needed (no numbers to redact), but inline-block disrupts overflow behavior
    return (
        <Paragraph typographyStyle={typographyStyle} variant={variant}>
            <HiddenPlaceholder disableKeepingWidth>
                <TextOverflowContainer
                    onMouseLeave={() => setIsClicked(false)}
                    data-testid="@tx-detail/txid-value"
                    id={tokenContractAddress}
                    $shouldAllowCopy={shouldAllowCopy}
                >
                    <SpanTextStart>{shortenAddress}</SpanTextStart>
                    {shouldAllowCopy ? (
                        <IconWrapper onClick={e => copy(e)}>
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
                                type="label"
                                variant="nostyle"
                                href={`${tokenExplorerUrl}`}
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
            </HiddenPlaceholder>
        </Paragraph>
    );
};
