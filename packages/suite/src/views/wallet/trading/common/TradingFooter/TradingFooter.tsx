import { useRef, useState } from 'react';

import { useTheme } from 'styled-components';

import { Box, Card, Divider, Image, Link, Modal, Paragraph, Row } from '@trezor/components';
import { useOnClickOutside } from '@trezor/react-utils';
import { DATA_TOS_INVITY_URL, INVITY_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';
import { TradingProvidedByInvity } from 'src/views/wallet/trading/common/TradingFooter/TradingProvidedByInvity';

import { TrezorLink } from '../../../../../components/suite';
import { useExternalLink } from '../../../../../hooks/suite';

export const TradingFooter = () => {
    const theme = useTheme();
    const invityUrl = useExternalLink(INVITY_URL);
    const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLAnchorElement>(null);

    useOnClickOutside([menuRef, toggleRef], () => {
        if (isInfoModalOpened) {
            setIsInfoModalOpened(false);
        }
    });

    return (
        <>
            <Box margin={{ top: 40 }}>
                <Divider />
                <Box margin={{ top: 20 }}>
                    <Row justifyContent="center">
                        <TradingProvidedByInvity />
                        <Row
                            alignItems="center"
                            justifyContent="flex-end"
                            flex="1"
                            hasDivider
                            gap={8}
                        >
                            <TrezorLink
                                href={DATA_TOS_INVITY_URL}
                                icon="arrowUpRight"
                                color={theme.textSubdued}
                                typographyStyle="label"
                            >
                                <Translation id="TR_TERMS_OF_USE_INVITY" />
                            </TrezorLink>
                            <Link
                                ref={toggleRef}
                                onClick={() => setIsInfoModalOpened(true)}
                                color={theme.textSubdued}
                                typographyStyle="label"
                            >
                                <Translation id="TR_BUY_LEARN_MORE" />
                            </Link>
                        </Row>
                    </Row>
                </Box>
            </Box>
            {isInfoModalOpened && (
                <Modal
                    variant="info"
                    heading={
                        <Link href={invityUrl} variant="nostyle" color={theme.textSubdued}>
                            <Image height={44} image="INVITY_LOGO" />
                        </Link>
                    }
                    bottomContent={
                        <>
                            <Modal.Button href={invityUrl} iconRight="arrowUpRight">
                                invity.io
                            </Modal.Button>
                        </>
                    }
                    onCancel={() => setIsInfoModalOpened(false)}
                >
                    <Card>
                        <Paragraph>
                            <Translation id="TR_BUY_FOOTER_TEXT_1" />
                        </Paragraph>
                        <Paragraph margin={{ top: 16 }}>
                            <Translation id="TR_BUY_FOOTER_TEXT_2" />
                        </Paragraph>
                    </Card>
                </Modal>
            )}
        </>
    );
};
