import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { Icon, Link } from '@trezor/components';
import { useState } from 'react';
import { copyToClipboard } from '@trezor/dom-utils';
import styled, { css, useTheme } from 'styled-components';

const IconWrapper = styled.div`
    display: none;
    padding: 1px;
    border-radius: 2px;
    margin-left: 4px;
    background-color: ${({ theme }) => theme.TYPE_DARK_GREY};
    height: 14px;

    :hover {
        opacity: 0.7;
    }
`;

const onHoverTextOverflowContainerHover = css`
    border-radius: 2px;
    background-color: ${({ theme }) => theme.BG_GREY};
    outline: 4px solid ${({ theme }) => theme.BG_GREY};
    z-index: 3;

    ${IconWrapper} {
        display: block;
    }
`;

const TextOverflowContainer = styled.div`
    position: relative;
    display: inline-flex;
    max-width: 100%;
    overflow: hidden;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    cursor: pointer;
    user-select: none;

    @media (hover: none) {
        ${onHoverTextOverflowContainerHover}
    }

    :hover,
    :focus {
        ${onHoverTextOverflowContainerHover}
    }
`;

const SpanTextStart = styled.span`
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const SpanTextEnd = styled.span`
    display: inline-block;
`;

interface IOAddressProps {
    explorerUrl?: string;
    txAddress?: string;
}

export const IOAddress = ({ txAddress, explorerUrl }: IOAddressProps) => {
    const [isClicked, setIsClicked] = useState(false);
    const theme = useTheme();

    const copy = () => {
        copyToClipboard(txAddress || '');

        setIsClicked(true);
    };

    if (!txAddress) {
        return null;
    }

    return (
        <HiddenPlaceholder>
            <TextOverflowContainer
                onMouseLeave={() => setIsClicked(false)}
                data-test="@tx-detail/txid-value"
                id={txAddress}
            >
                {txAddress.length <= 5 ? (
                    <SpanTextEnd onClick={copy}>{txAddress}</SpanTextEnd>
                ) : (
                    <>
                        <SpanTextStart onClick={copy}>{txAddress.slice(0, -4)}</SpanTextStart>
                        <SpanTextEnd onClick={copy}>{txAddress.slice(-4)}</SpanTextEnd>
                    </>
                )}
                <IconWrapper onClick={copy}>
                    <Icon icon={isClicked ? 'CHECK' : 'COPY'} size={12} color={theme.BG_WHITE} />
                </IconWrapper>
                {explorerUrl ? (
                    <IconWrapper>
                        <Link size="tiny" variant="nostyle" href={`${explorerUrl}${txAddress}`}>
                            <Icon icon="EXTERNAL_LINK" size={12} color={theme.BG_WHITE} />
                        </Link>
                    </IconWrapper>
                ) : null}
            </TextOverflowContainer>
        </HiddenPlaceholder>
    );
};
