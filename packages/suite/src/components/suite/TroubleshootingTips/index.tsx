import React from 'react';
import styled from 'styled-components';
import { Translation, TrezorLink } from '@suite-components';
import CollapsibleBox from '@suite-components/CollapsibleBox'; // build fails due if imported from suite-components
import { variables, Button } from '@trezor/components';
import { SUPPORT_URL } from '@suite-constants/urls';
import TrezorConnect from 'trezor-connect';

const WhiteCollapsibleBox = styled(CollapsibleBox)`
    background: ${props => props.theme.BG_WHITE};
    min-width: 480px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        min-width: 380px;
    }
`;

const ItemLabel = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ItemDescription = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 2px;
`;

const Bullet = styled.span`
    margin-right: 8px;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Items = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px 30px;
`;

const Item = styled.div`
    display: flex;

    & + & {
        margin-top: 16px;
    }
`;

const ItemContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const ContactSupport = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    padding: 18px 30px;
    align-items: center;
`;

const FooterText = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Item {
    key: string;
    heading?: React.ReactNode;
    description?: React.ReactNode;
    hide?: boolean;
}

interface Props {
    label: React.ReactNode;
    cta?: React.ReactNode;
    items: Item[];
    offerWebUsb?: boolean;
}

const TroubleshootingTips = ({ label, items, cta, offerWebUsb }: Props) => (
    <WhiteCollapsibleBox
        variant="large"
        heading={cta}
        iconLabel={label}
        noContentPadding
        data-test="@onboarding/expand-troubleshooting-tips"
    >
        <Items>
            {items
                .filter(item => !item.hide)
                .map(item => (
                    <Item key={item.key}>
                        <Bullet>&bull;</Bullet>
                        <ItemContent>
                            <ItemLabel>{item.heading}</ItemLabel>
                            <ItemDescription>{item.description}</ItemDescription>
                        </ItemContent>
                    </Item>
                ))}
        </Items>

        {offerWebUsb && (
            <Button
                variant="secondary"
                data-test="@onboarding/try-bridge-button"
                onClick={() => TrezorConnect.disableWebUSB()}
            >
                <Translation id="TR_DISABLE_WEBUSB_TRY_BRIDGE" />
            </Button>
        )}

        <ContactSupport>
            <FooterText>
                <Translation id="TR_ONBOARDING_TROUBLESHOOTING_FAILED" />
            </FooterText>
            <TrezorLink variant="nostyle" href={SUPPORT_URL}>
                <Button variant="tertiary">
                    <Translation id="TR_CONTACT_SUPPORT" />
                </Button>
            </TrezorLink>
        </ContactSupport>
    </WhiteCollapsibleBox>
);

export default TroubleshootingTips;
