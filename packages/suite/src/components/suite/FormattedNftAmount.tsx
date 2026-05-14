import { Translation, useTranslation } from '@suite/intl';
import { type SignValue } from '@suite-common/suite-types';
import { getExplorerUrl } from '@suite-common/wallet-config';
import { selectExplorer } from '@suite-common/wallet-core';
import { isNftMultitokenTransfer } from '@suite-common/wallet-utils';
import { Box, Column, Row, Text } from '@trezor/components';
import { type TokenTransfer } from '@trezor/connect';
import { type TypographyStyle, spacings } from '@trezor/theme';

import { HiddenPlaceholder, Sign } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useSelector } from 'src/hooks/suite/useSelector';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { RedactNumericalValue } from './RedactNumericalValue';

export interface FormattedNftAmountProps {
    transfer: TokenTransfer;
    signValue?: SignValue;
    signGrayscale?: boolean;
    className?: string;
    isWithLink?: boolean;
    alignMultitoken?: 'flex-end' | 'flex-start';
    linkTypographyStyle?: TypographyStyle;
}

export const FormattedNftAmount = ({
    transfer,
    signValue,
    signGrayscale,
    className,
    isWithLink,
    alignMultitoken = 'flex-end',
    linkTypographyStyle,
}: FormattedNftAmountProps) => {
    const { translationString } = useTranslation();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { network } = selectedAccount;
    const explorer = useSelector(state => selectExplorer(state, network?.symbol));

    const symbolComponent = transfer.symbol ? (
        <Text ellipsisLineCount={1}>
            <BlurUrls text={transfer.symbol} />
        </Text>
    ) : null;

    const isMultitoken = isNftMultitokenTransfer(transfer);

    if (isMultitoken) {
        const tokens = transfer.multiTokenValues;

        return (
            <Column alignItems={alignMultitoken}>
                {tokens?.map((token, index) => (
                    <Row key={`${token.id}-${index}`} gap={spacings.xxs}>
                        <Row>
                            {signValue ? (
                                <Sign value={signValue} grayscale={signGrayscale} />
                            ) : null}
                            {transfer.name ? (
                                <BlurUrls
                                    text={translationString('TR_COLLECTION_NAME_OF_TOKEN_ID', {
                                        tokenValue: token.value,
                                        collectionName: transfer.name,
                                    })}
                                />
                            ) : (
                                <Row gap={spacings.xxs}>
                                    <Row>{token.value}x</Row>
                                    <Translation id="TR_TOKEN_ID_COLON" />
                                </Row>
                            )}
                        </Row>
                        {isWithLink && network?.networkType === 'ethereum' ? (
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

    return (
        <Row className={className}>
            {signValue ? <Sign value={signValue} grayscale={signGrayscale} /> : null}
            <Box margin={{ right: spacings.xxs }}>
                <Translation id="TR_TOKEN_ID_COLON" />
            </Box>
            {isWithLink ? (
                <TrezorLink
                    href={
                        network?.networkType === 'ethereum'
                            ? `${getExplorerUrl(explorer, 'nft')}${transfer.contract}/${transfer.amount}`
                            : undefined
                    }
                    typographyStyle={linkTypographyStyle}
                >
                    <Row gap={spacings.zero}>
                        <Text maxWidth={145} ellipsisLineCount={1} intent="brand">
                            <HiddenPlaceholder>
                                <RedactNumericalValue value={transfer.amount} />
                            </HiddenPlaceholder>
                            &nbsp;
                        </Text>
                        {symbolComponent}
                    </Row>
                </TrezorLink>
            ) : (
                <Row padding={{ horizontal: 4 }}>
                    <Text maxWidth={145} ellipsisLineCount={1}>
                        <HiddenPlaceholder>
                            <RedactNumericalValue value={transfer.amount} />
                        </HiddenPlaceholder>
                        &nbsp;
                    </Text>
                    {symbolComponent}
                </Row>
            )}
        </Row>
    );
};
