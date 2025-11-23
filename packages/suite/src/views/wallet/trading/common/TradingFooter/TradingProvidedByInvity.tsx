import { Center, Image, Paragraph } from '@trezor/components';
import { INVITY_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';

import { TrezorLink } from '../../../../../components/suite';

export const TradingProvidedByInvity = () => (
    <Center>
        <Paragraph variant="tertiary" typographyStyle="label">
            <Translation id="TR_BUY_PROVIDED_BY_INVITY" />
        </Paragraph>
        <TrezorLink href={INVITY_URL} variant="nostyle">
            <Image width={70} image="INVITY_LOGO" />
        </TrezorLink>
    </Center>
);
