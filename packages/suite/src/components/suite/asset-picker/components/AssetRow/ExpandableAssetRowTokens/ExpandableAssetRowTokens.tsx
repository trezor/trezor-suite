import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Collapsible, Row, Text } from '@trezor/components';
import { CaretUpDownIcon, CaretUpDownReverseIcon } from '@trezor/icons';
import { TokenIconSet } from '@trezor/product-components';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { getExpandableTokensContentHeight } from '../../../utils';
import { AssetRowToken } from '../AssetRowToken/AssetRowToken';

// Don't use `Collapsible.Content`, it's not optimized for larger content.
// Use this custom component, thanks to 'will-change' it acts as single layer.
const CollapsibleContent = styled.div<{ $contentHeight: number; $expanded: boolean }>`
    will-change: opacity;
    height: ${({ $contentHeight }) => $contentHeight}px;
    overflow: hidden;
    position: relative;
    transition: opacity 350ms ease-out;
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
`;

export interface ExpandableAssetRowTokensProps {
    label: TranslationKey;
    account: Account;
    tokens: TokensWithRates[];
    expanded: boolean;
    onExpandToggle: (accountKey: AccountKey, expanded: boolean) => void;
    onTokenClick?: (token: TokensWithRates, account: Account) => void;
    height: number;
    dataTestId?: string;
    showTokensPreview?: boolean;
}

export function ExpandableAssetRowTokens({
    label,
    account,
    tokens,
    expanded,
    onExpandToggle,
    onTokenClick,
    height,
    dataTestId,
    showTokensPreview = false,
}: ExpandableAssetRowTokensProps) {
    const tokensContentHeight = expanded ? getExpandableTokensContentHeight(tokens.length) : 0;

    return (
        <Collapsible isOpen={expanded} data-testid={dataTestId}>
            <Box padding={2} height={height}>
                <Card type="contrast" paddingType="none">
                    <Collapsible.Toggle
                        onClick={() => {
                            // The operation will be probably expensive. Ask for fresh frame before switching the state.
                            requestAnimationFrame(() => {
                                onExpandToggle(account.key, !expanded);
                            });
                        }}
                    >
                        <Row
                            alignItems="center"
                            justifyContent="space-between"
                            gap={12}
                            padding={{
                                vertical: 12,
                                horizontal: 16,
                            }}
                        >
                            <Text typographyStyle="body-sm">
                                <Translation id={label} />
                            </Text>

                            <Row alignItems="center" gap={12}>
                                {showTokensPreview && (
                                    <TokenIconSet
                                        symbol={account.symbol}
                                        tokens={tokens}
                                        size={24}
                                        gap={20}
                                        isCentered={false}
                                        isCountVisible
                                        isReversed={false}
                                    />
                                )}

                                <Collapsible.ToggleIcon
                                    icon={expanded ? CaretUpDownReverseIcon : CaretUpDownIcon}
                                />
                            </Row>
                        </Row>
                    </Collapsible.Toggle>

                    <CollapsibleContent $contentHeight={tokensContentHeight} $expanded={expanded}>
                        {expanded &&
                            tokens.map(token => (
                                <AssetRowToken
                                    key={token.contract}
                                    token={token}
                                    account={account}
                                    onClick={onTokenClick}
                                    isHiddenToken={true}
                                />
                            ))}
                    </CollapsibleContent>
                </Card>
            </Box>
        </Collapsible>
    );
}
