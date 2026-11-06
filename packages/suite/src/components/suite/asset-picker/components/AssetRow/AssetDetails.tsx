import { TokenName, TokenSymbol } from '@suite/token';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Badge, Column, Row, Text } from '@trezor/components';
import { hasOwn } from '@trezor/utils';

type AssetDetailsProps = {
    name: string;
    displaySymbol: string;
    isDisabled?: boolean;
    tokenContract?: TokenAddress;
} & (
    | {
          networkSymbol: NetworkSymbol;
      }
    | {
          networkName: string;
      }
);

export function AssetDetails({
    name,
    displaySymbol,
    isDisabled = false,
    tokenContract,
    ...props
}: AssetDetailsProps) {
    const badge = hasOwn(props, 'networkSymbol')
        ? getNetwork(props.networkSymbol).name
        : props.networkName;
    const tokenNameProps =
        tokenContract && hasOwn(props, 'networkSymbol')
            ? { networkSymbol: props.networkSymbol, tokenContract }
            : undefined;

    return (
        <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
            <Text
                typographyStyle="body-md"
                ellipsisLineCount={1}
                maxWidth="100%"
                isDisabled={isDisabled}
            >
                {tokenNameProps ? <TokenName {...tokenNameProps} /> : name}
            </Text>
            <Row gap={8} alignItems="center">
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    isDisabled={isDisabled}
                >
                    {tokenNameProps ? <TokenSymbol {...tokenNameProps} /> : displaySymbol}
                </Text>
                {badge !== name && <Badge size="small">{badge}</Badge>}
            </Row>
        </Column>
    );
}
