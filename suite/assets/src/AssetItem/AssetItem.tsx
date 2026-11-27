import { type AssetBalance } from '@suite-common/wallet-types';
import { type FrameProps, GhostContainer, Row } from '@trezor/components';

import { AssetItemBalance } from './AssetItemBalance';
import { AssetItemIdentity, type AssetItemIdentityProps } from './AssetItemIdentity';
import { ASSET_ITEM_HEIGHT } from './assetItemConstants';

export type AssetItemProps = Pick<
    AssetItemIdentityProps,
    'networkSymbol' | 'contractAddress' | 'badge' | 'isDisabled'
> &
    Pick<FrameProps, 'borderRadius' | 'padding'> & {
        balance?: AssetBalance;
        onClick: () => void;
        'data-testid'?: string;
    };

export const AssetItem = ({
    networkSymbol,
    contractAddress,
    badge,
    balance,
    onClick,
    isDisabled = false,
    borderRadius = 10,
    padding = { top: 12, right: 12, bottom: 12, left: 8 },
    'data-testid': dataTestId,
}: AssetItemProps) => (
    <GhostContainer
        width="100%"
        height={ASSET_ITEM_HEIGHT}
        borderRadius={borderRadius}
        padding={padding}
        isDisabled={isDisabled}
        data-testid={dataTestId}
        onClick={event => {
            event.stopPropagation();
            onClick();
        }}
    >
        <Row justifyContent="space-between" gap={12} height="100%">
            <AssetItemIdentity
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                badge={badge}
                isDisabled={isDisabled}
            />
            {balance && (
                <AssetItemBalance
                    networkSymbol={networkSymbol}
                    contractAddress={contractAddress}
                    balance={balance}
                    isDisabled={isDisabled}
                    maxWidth="50%"
                />
            )}
        </Row>
    </GhostContainer>
);

AssetItem.Identity = AssetItemIdentity;
AssetItem.Balance = AssetItemBalance;
