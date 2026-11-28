import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { TrezorLink } from '@suite/external-links';
import { Translation, useTranslation } from '@suite/intl';
import { TokenUrlBlur } from '@suite/token';
import { type SignValue } from '@suite-common/suite-types';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getExplorerUrl, getNetworkType } from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { isNftMultitokenTransfer } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { type TokenTransfer } from '@trezor/connect';
import { type TypographyStyle } from '@trezor/theme';

import { useSelector } from '#src/hooks/suite/useSelector';

import { Sign } from './Sign';

export interface FormattedNftAmountProps {
    transfer: TokenTransfer;
    networkSymbol: NetworkSymbol;
    signValue?: SignValue;
    signGrayscale?: boolean;
    isWithLink?: boolean;
    alignNft?: 'flex-end' | 'flex-start';
    linkTypographyStyle?: TypographyStyle;
}

export const FormattedNftAmount = ({
    transfer,
    networkSymbol,
    signValue,
    signGrayscale,
    isWithLink,
    alignNft = 'flex-end',
    linkTypographyStyle,
}: FormattedNftAmountProps) => {
    const { translationString } = useTranslation();
    const networkType = getNetworkType(networkSymbol);
    const explorer = useSelector(state => selectExplorer(state, networkSymbol));

    const symbolComponent = transfer.symbol ? (
        <Text ellipsisLineCount={1}>
            <TokenUrlBlur
                networkSymbol={networkSymbol}
                tokenContract={toTokenAddress(transfer.contract)}
                text={transfer.symbol}
            />
        </Text>
    ) : null;

    const isMultitoken = isNftMultitokenTransfer(transfer);

    if (isMultitoken) {
        const tokens = transfer.multiTokenValues;

        return (
            <Column alignItems={alignNft}>
                {tokens?.map((token, index) => (
                    <Row key={`${token.id}-${index}`} gap={4}>
                        <Row>
                            {signValue ? (
                                <Sign value={signValue} grayscale={signGrayscale} />
                            ) : null}
                            {transfer.name ? (
                                <TokenUrlBlur
                                    networkSymbol={networkSymbol}
                                    tokenContract={toTokenAddress(transfer.contract)}
                                    text={translationString('TR_COLLECTION_NAME_OF_TOKEN_ID', {
                                        tokenValue: token.value,
                                        collectionName: transfer.name,
                                    })}
                                />
                            ) : (
                                <Row gap={4}>
                                    <Row>{token.value}x</Row>
                                    <Translation id="TR_TOKEN_ID_COLON" />
                                </Row>
                            )}
                        </Row>
                        {isWithLink && networkType === 'ethereum' ? (
                            <TrezorLink
                                href={`${getExplorerUrl(explorer, 'nft')}${transfer.contract}/${token.id}`}
                                typographyStyle={linkTypographyStyle}
                            >
                                <Text maxWidth={145} ellipsisLineCount={1} intent="brand">
                                    {token.id}
                                </Text>
                            </TrezorLink>
                        ) : (
                            <Text maxWidth={145} ellipsisLineCount={1}>
                                {token.id}
                            </Text>
                        )}
                    </Row>
                ))}
            </Column>
        );
    }

    const tokenDetails = (
        <Row gap={4}>
            <Text maxWidth={145} ellipsisLineCount={1} intent={isWithLink ? 'brand' : undefined}>
                <HiddenPlaceholder>
                    <RedactNumericalValue value={transfer.amount} />
                </HiddenPlaceholder>
            </Text>
            {symbolComponent}
        </Row>
    );

    return (
        <Row justifyContent={alignNft}>
            {signValue ? <Sign value={signValue} grayscale={signGrayscale} /> : null}
            <Row gap={4}>
                <Translation id="TR_TOKEN_ID_COLON" />
                {isWithLink ? (
                    <TrezorLink
                        href={
                            networkType === 'ethereum'
                                ? `${getExplorerUrl(explorer, 'nft')}${transfer.contract}/${transfer.amount}`
                                : undefined
                        }
                        typographyStyle={linkTypographyStyle}
                    >
                        {tokenDetails}
                    </TrezorLink>
                ) : (
                    tokenDetails
                )}
            </Row>
        </Row>
    );
};
