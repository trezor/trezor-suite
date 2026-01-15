import styled from 'styled-components';

import { Account, AccountKey } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { Card, Collapsible, Row, Text } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { TokensWithRates } from 'src/utils/wallet/tokenUtils';

import { EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT } from '../../../constants';
import { AssetRowToken } from '../AssetRowToken/AssetRowToken';

// Don't use `Collapsible.Content`, it's not optimized for larger content.
// Use this custom component, thanks to 'will-change' it acts as single layer.
const CollapsibleContent = styled.div<{ $height: number; $expanded: boolean }>`
    will-change: opacity;
    height: ${({ $height, $expanded }) =>
        $expanded ? $height - EXPANDABLE_ASSET_ROW_TOKENS_HEADER_HEIGHT : 0}px;
    overflow: hidden;
    position: relative;
    transition: opacity 0.4s ease-in-out;
    opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
`;

export interface ExpandableAssetRowTokensProps {
    account: Account;
    tokens: TokensWithRates[];
    expanded: boolean;
    onExpandToggle: (accountKey: AccountKey, expanded: boolean) => void;
    onTokenClick: (token: TokenInfo, account: Account) => void;
    height: number;
}

export function ExpandableAssetRowTokens({
    account,
    tokens,
    expanded,
    onExpandToggle,
    onTokenClick,
    height,
}: ExpandableAssetRowTokensProps) {
    return (
        <Collapsible isOpen={expanded}>
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
                        <Text typographyStyle="hint">
                            <Translation id="TR_HIDDEN_TOKENS" />
                        </Text>

                        <Collapsible.ToggleIcon
                            iconName={expanded ? 'caretUpDownReverse' : 'caretUpDown'}
                        />
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
                                hiddenToken={true}
                            />
                        ))}
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
