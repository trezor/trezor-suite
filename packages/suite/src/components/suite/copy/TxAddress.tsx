import { useState } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { Icon, Link, Text, TextVariant } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { TypographyStyle } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAddressDisplayType } from 'src/selectors/suite/suiteSelectors';

type DisplayMode = 'copy' | 'modal' | 'static';

const IconWrapper = styled.div`
    display: block;
    padding: 1px;
    border-radius: 2px;
    opacity: 0;
    transition: 250ms ease;
    margin-left: 4px;
    background-color: ${({ theme }) => theme.iconSubdued};
    height: 14px;
`;

const onHoverTextOverflowContainerHover = css`
    border-radius: 2px;
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    outline: 4px solid ${({ theme }) => theme.backgroundSurfaceElevation2};
    z-index: 3;

    ${IconWrapper} {
        opacity: 1;

        &:hover {
            opacity: 0.7;
        }
    }
`;

const TextOverflowContainer = styled.div<{ $displayMode: DisplayMode }>`
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    overflow: hidden;
    cursor: ${({ $displayMode }) => ($displayMode === 'static' ? 'default' : 'pointer')};
    user-select: none;

    ${({ $displayMode }) =>
        $displayMode !== 'static' &&
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

const getDisplayMode = (
    shouldAllowCopy: boolean,
    account?: Account,
    txAddress?: string,
): DisplayMode => {
    if (shouldAllowCopy) return 'copy';
    if (account && txAddress) return 'modal';

    return 'static';
};

interface TxAddressProps {
    explorerUrl?: string;
    txAddress?: string;
    explorerUrlQueryString?: string;
    shouldAllowCopy?: boolean;
    shouldChunk?: boolean;
    variant?: TextVariant;
    typographyStyle?: TypographyStyle;
    account?: Account;
}

export const TxAddress = ({
    txAddress,
    explorerUrl,
    explorerUrlQueryString = '',
    shouldAllowCopy = true,
    shouldChunk = false,
    variant = 'default',
    typographyStyle = 'label',
    account,
}: TxAddressProps) => {
    const isChunkedSettings = useSelector(selectAddressDisplayType);
    const [isClicked, setIsClicked] = useState(false);
    const theme = useTheme();
    const dispatch = useDispatch();

    if (!txAddress) return null;

    const displayMode = getDisplayMode(shouldAllowCopy, account, txAddress);

    const formattedTxAddress =
        shouldChunk && isChunkedSettings === 'chunked'
            ? txAddress.match(/.{1,4}/g)?.join(' ') || txAddress
            : txAddress;

    const handleClick = () => {
        if (displayMode === 'copy') {
            copyToClipboard(txAddress);
            setIsClicked(true);
        } else if (displayMode === 'modal') {
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid: txAddress,
                    descriptor: account!.descriptor,
                    symbol: account!.symbol,
                    deviceState: account!.deviceState,
                    flow: 'detail',
                }),
            );
        }
    };

    return (
        <Text typographyStyle={typographyStyle} variant={variant}>
            <HiddenPlaceholder disableKeepingWidth>
                <TextOverflowContainer
                    onMouseLeave={() => setIsClicked(false)}
                    data-testid="@tx-detail/txid-value"
                    id={txAddress}
                    $displayMode={displayMode}
                >
                    <Text wordBreak="break-all" onClick={handleClick}>
                        {formattedTxAddress}
                    </Text>

                    {displayMode === 'copy' && (
                        <IconWrapper onClick={handleClick}>
                            <Icon
                                name={isClicked ? 'check' : 'copy'}
                                size={12}
                                color={theme.iconOnPrimary}
                            />
                        </IconWrapper>
                    )}

                    {explorerUrl && (
                        <IconWrapper>
                            <Link href={`${explorerUrl}${txAddress}${explorerUrlQueryString}`}>
                                <Icon name="arrowUpRight" size={12} color={theme.iconOnPrimary} />
                            </Link>
                        </IconWrapper>
                    )}
                </TextOverflowContainer>
            </HiddenPlaceholder>
        </Text>
    );
};
