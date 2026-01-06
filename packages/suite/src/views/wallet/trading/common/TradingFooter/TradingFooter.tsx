import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';
import styled, { css } from 'styled-components';

import { Column, Link, Row, Text, Tooltip } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';

const Wrapper = styled.div`
    margin-top: ${spacingsPx.xl};
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
`;

const linkStyle = css`
    color: ${({ theme }) => theme.textSubdued};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.textSubdued};
        text-decoration: underline;
    }
`;

// reason: different design then basic Link
// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLink = styled(Link)`
    ${linkStyle}
`;

const StyledLinkUnderline = styled(StyledLink)`
    text-decoration: underline;
`;

interface TradingFooterProps {
    provider?: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
}

export const TradingFooter = ({ provider }: TradingFooterProps) => (
    <Wrapper>
        <Column alignItems="center" margin={{ top: spacings.xl }} gap={spacings.sm}>
            <Text typographyStyle="hint" variant="tertiary">
                <Translation id="TR_TRADING_TERMS_1" />
                {provider ? (
                    <StyledLinkUnderline href={provider.termsUrl} variant="nostyle">
                        <Translation
                            id="TR_TRADING_TERMS_PROVIDER"
                            values={{ companyName: provider.companyName }}
                        />
                    </StyledLinkUnderline>
                ) : (
                    <Translation id="TR_TRADING_TERMS_2" />
                )}
            </Text>

            <Text typographyStyle="hint" variant="tertiary">
                <Row gap={spacings.xs} alignItems="center">
                    <StyledLink href={TREZOR_SUITE_TOS_URL} variant="nostyle">
                        <Translation id="TR_TERMS_OF_USE_TREZOR" />
                    </StyledLink>
                    <Text>|</Text>
                    <Tooltip
                        content={
                            <Column gap={spacings.sm}>
                                <Translation id="TR_BUY_FOOTER_TEXT_1" />
                                <Translation id="TR_BUY_FOOTER_TEXT_2" />
                            </Column>
                        }
                        cursor="default"
                    >
                        <StyledLink href={TREZOR_TRADING_LEARN_MORE_URL} variant="nostyle">
                            <Translation id="TR_BUY_LEARN_MORE" />
                        </StyledLink>
                    </Tooltip>
                </Row>
            </Text>
        </Column>
    </Wrapper>
);
