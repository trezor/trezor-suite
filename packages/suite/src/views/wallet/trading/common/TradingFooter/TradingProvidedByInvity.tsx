import { Image, Link, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { INVITY_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite';
import { TradingFooterLogoWrapper } from 'src/views/wallet/trading';

export const TradingProvidedByInvity = () => (
    <Text typographyStyle="hint" variant="tertiary">
        <Row alignItems="center" gap={spacings.xxxs}>
            <Translation id="TR_BUY_PROVIDED_BY_INVITY" />
            <TradingFooterLogoWrapper>
                <Link href={INVITY_URL} target="_blank">
                    <Image width={70} image="INVITY_LOGO" />
                </Link>
            </TradingFooterLogoWrapper>
        </Row>
    </Text>
);
