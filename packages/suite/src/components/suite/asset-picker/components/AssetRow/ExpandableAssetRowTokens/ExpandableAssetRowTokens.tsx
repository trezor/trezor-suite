import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Card, Collapsible, Row, Text } from '@trezor/components';
import { TokenIconSet } from '@trezor/product-components';

import { EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT } from 'src/components/suite/asset-picker/constants';
import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { AssetRowToken } from '../AssetRowToken/AssetRowToken';

// Don't use `Collapsible.Content`, it's not optimized for larger content.
// Use this custom component, thanks to 'will-change' it acts as single layer.
const CollapsibleContent = styled.div<{ $height: number; $expanded: boolean }>`
    will-change: opacity;
    height: ${({ $height, $expanded }) =>
        $expanded ? $height - EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT : 0}px;
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
    onTokenClick?: (token: TokenInfo, account: Account) => void;
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
    return (
        <Collapsible isOpen={expanded} data-testid={dataTestId}>
            <Card fillType="flat" paddingType="none">
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
                                iconName={expanded ? 'caretUpDownReverse' : 'caretUpDown'}
                            />
                        </Row>
                    </Row>
                </Collapsible.Toggle>

                <CollapsibleContent $height={height} $expanded={expanded}>
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
        </Collapsible>
    );
}
