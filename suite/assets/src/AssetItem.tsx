import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type AssetId } from '@suite-common/tokens';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { type AmountUnit } from '@suite-common/wallet-utils';
import { Column, GhostContainer, Row, Text } from '@trezor/components';
import { type NetworkConfigState } from '@trezor/network-module-types';
import { selectShouldShowNetworkIcon } from '@trezor/product-components';

import { AssetIcon } from './AssetIcon';
import { AssetName } from './AssetName';
import { AssetValue } from './AssetValue';
import { ASSET_ITEM_HEIGHT } from './assetItemConstants';

export type AssetItemProps = {
    assetId: AssetId;
    cryptoAmount?: AmountUnit;
    fiatAmount?: BaseCurrencyAmount | null;
    onClick: (assetId: AssetId) => void;
    isDisabled?: boolean;
    'data-testid'?: string;
};

export const AssetItem = ({
    assetId,
    cryptoAmount,
    fiatAmount,
    onClick,
    isDisabled = false,
    'data-testid': dataTestId,
}: AssetItemProps) => {
    const { networkSymbol, contractAddress } = assetId;
    const { NetworkNameFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const showNetworkIcon = useSelector(
        (state: NetworkConfigState) =>
            !contractAddress || selectShouldShowNetworkIcon(state, networkSymbol, contractAddress),
    );
    const hasFiatAmount = fiatAmount !== undefined && fiatAmount !== null;
    const hasCryptoAmount = cryptoAmount !== undefined;

    return (
        <GhostContainer
            width="100%"
            height={ASSET_ITEM_HEIGHT}
            padding={{ top: 12, right: 12, bottom: 12, left: 8 }}
            isDisabled={isDisabled}
            data-testid={dataTestId}
            onClick={event => {
                event.stopPropagation();
                onClick(assetId);
            }}
        >
            <Row justifyContent="space-between" gap={12} height="100%">
                <Row gap={12} overflow="hidden" flex="1" minWidth={0}>
                    <AssetIcon {...assetId} size={40} showNetworkIcon={showNetworkIcon} />
                    <Column alignItems="flex-start" overflow="hidden" minWidth={0}>
                        <Text
                            typographyStyle="body-md"
                            intent="neutral"
                            ellipsisLineCount={1}
                            maxWidth="100%"
                            isDisabled={isDisabled}
                        >
                            <AssetName {...assetId} />
                        </Text>
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            ellipsisLineCount={1}
                            maxWidth="100%"
                            isDisabled={isDisabled}
                        >
                            <NetworkNameFormatter value={networkSymbol} />
                        </Text>
                    </Column>
                </Row>
                {(hasFiatAmount || hasCryptoAmount) && (
                    <Column alignItems="flex-end" flex="0 1 auto" minWidth={0} maxWidth="50%">
                        {hasFiatAmount && (
                            <Text
                                typographyStyle="body-md"
                                intent="neutral"
                                isDisabled={isDisabled}
                                ellipsisLineCount={1}
                                maxWidth="100%"
                            >
                                <HiddenPlaceholder>
                                    <BaseCurrencyAmountFormatter value={fiatAmount} />
                                </HiddenPlaceholder>
                            </Text>
                        )}
                        {hasCryptoAmount && (
                            <Text
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                                isDisabled={isDisabled}
                                ellipsisLineCount={1}
                                maxWidth="100%"
                            >
                                <AssetValue amount={cryptoAmount} {...assetId} isCompact />
                            </Text>
                        )}
                    </Column>
                )}
            </Row>
        </GhostContainer>
    );
};
