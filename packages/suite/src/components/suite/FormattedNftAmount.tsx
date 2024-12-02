import { useTheme } from 'styled-components';

import { SignValue } from '@suite-common/suite-types';
import { isNftMultitokenTransfer } from '@suite-common/wallet-utils';
import { TokenTransfer } from '@trezor/connect';
import { Box, Column, Row, Text } from '@trezor/components';
import { spacings, TypographyStyle } from '@trezor/theme';

import { HiddenPlaceholder, Sign, Translation } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useTranslation } from 'src/hooks/suite';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

export interface FormattedNftAmountProps {
    transfer: TokenTransfer;
    signValue?: SignValue;
    className?: string;
    isWithLink?: boolean;
    alignMultitoken?: 'flex-end' | 'flex-start';
    linkTypographyStyle?: TypographyStyle;
}

export const FormattedNftAmount = ({
    transfer,
    signValue,
    className,
    isWithLink,
    alignMultitoken = 'flex-end',
    linkTypographyStyle,
}: FormattedNftAmountProps) => {
    const theme = useTheme();
    const { translationString } = useTranslation();
    const { selectedAccount } = useSelector(state => state.wallet);
    const { network } = selectedAccount;

    const symbolComponent = transfer.symbol ? (
        <Text ellipsisLineCount={1}>
            <BlurUrls text={transfer.symbol} />
        </Text>
    ) : null;

    const isMultitoken = isNftMultitokenTransfer(transfer);

    if (isMultitoken) {
        const tokens = transfer.multiTokenValues;

        return (
            <HiddenPlaceholder>
                <Column alignItems={alignMultitoken}>
                    {tokens?.map((token, index) => (
                        <Row key={`${token.id}-${index}`} gap={spacings.xxs}>
                            <Row>
                                {signValue ? <Sign value={signValue} /> : null}
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
                                        <Translation id="TR_TOKEN_ID" />
                                    </Row>
                                )}
                            </Row>
                            {isWithLink && network?.networkType === 'ethereum' ? (
                                <TrezorLink
                                    href={`${network?.explorer.nft}/${transfer.contract}/${token.id}`}
                                    color={theme.textSecondaryHighlight}
                                    variant="underline"
                                    typographyStyle={linkTypographyStyle}
                                >
                                    <Text maxWidth={145} ellipsisLineCount={1}>
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
            </HiddenPlaceholder>
        );
    }

    return (
        <HiddenPlaceholder>
            <Row className={className}>
                {signValue ? <Sign value={signValue} /> : null}
                <Box margin={{ right: spacings.xxs }}>
                    <Translation id="TR_TOKEN_ID" />
                </Box>
                {isWithLink ? (
                    <TrezorLink
                        href={
                            network?.networkType === 'ethereum'
                                ? `${network?.explorer.nft}/${transfer.contract}/${transfer.amount}`
                                : undefined
                        }
                        color={theme.textSecondaryHighlight}
                        variant="underline"
                        typographyStyle={linkTypographyStyle}
                    >
                        <Row gap={spacings.zero}>
                            <Text maxWidth={145} ellipsisLineCount={1}>
                                {transfer.amount}
                            </Text>
                            &nbsp;
                            {symbolComponent}
                        </Row>
                    </TrezorLink>
                ) : (
                    <Row gap={spacings.xxs}>
                        <Text maxWidth={145} ellipsisLineCount={1}>
                            {transfer.amount}
                        </Text>
                        {symbolComponent}
                    </Row>
                )}
            </Row>
        </HiddenPlaceholder>
    );
};
