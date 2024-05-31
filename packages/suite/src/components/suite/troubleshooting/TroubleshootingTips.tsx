import { useMemo, ReactNode } from 'react';
import styled from 'styled-components';
import { Translation, TrezorLink } from 'src/components/suite';
import { variables, Button, CollapsibleBox, useElevation } from '@trezor/components';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';
import TrezorConnect from '@trezor/connect';
import { isAndroid } from '@trezor/env-utils';
import { Elevation, mapElevationToBorder } from '@trezor/theme';

const ItemLabel = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ItemDescription = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 2px;
`;

const Bullet = styled.span`
    margin-right: 8px;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Items = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
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
    width: 100%;
`;

const ItemAction = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
    padding-left: 24px;
`;

const ContactSupport = styled.div<{ $elevation: Elevation }>`
    display: flex;
    justify-content: space-between;
    margin: 24px -16px 0;
    padding: 20px 20px 0;
    border-top: 1px solid ${mapElevationToBorder};
    align-items: center;
`;

const FooterText = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledButton = styled(Button)`
    margin: 0 20px 20px;
`;

interface Item {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    noBullet?: boolean;
    action?: ReactNode;
}

interface TroubleshootingTipsProps {
    label: ReactNode;
    cta?: ReactNode;
    items: Item[];
    offerWebUsb?: boolean;
    opened?: boolean;
    'data-test'?: string;
}

export const TroubleshootingTips = ({
    label,
    items,
    cta,
    offerWebUsb,
    opened,
    'data-test': dataTest,
}: TroubleshootingTipsProps) => {
    const { elevation } = useElevation();

    const memoizedItems = useMemo(
        () =>
            items
                .filter(item => !item.hide)
                .map(item => (
                    <Item key={item.key}>
                        {!item.noBullet && <Bullet>&bull;</Bullet>}

                        <ItemContent>
                            <ItemLabel>{item.heading}</ItemLabel>
                            <ItemDescription>{item.description}</ItemDescription>
                        </ItemContent>

                        {item.action && <ItemAction>{item.action}</ItemAction>}
                    </Item>
                )),
        [items],
    );

    return (
        <CollapsibleBox
            paddingType="large"
            heading={cta}
            iconLabel={label}
            defaultIsOpen={opened}
            data-test={dataTest || '@onboarding/expand-troubleshooting-tips'}
        >
            {items.length > 0 && <Items>{memoizedItems}</Items>}

            {offerWebUsb && !isAndroid() && (
                <StyledButton
                    variant="secondary"
                    data-test="@onboarding/try-bridge-button"
                    onClick={() => TrezorConnect.disableWebUSB()}
                >
                    <Translation id="TR_DISABLE_WEBUSB_TRY_BRIDGE" />
                </StyledButton>
            )}

            <ContactSupport $elevation={elevation}>
                <FooterText>
                    <Translation id="TR_ONBOARDING_TROUBLESHOOTING_FAILED" />
                </FooterText>

                <TrezorLink variant="nostyle" href={TREZOR_SUPPORT_DEVICE_URL}>
                    <Button variant="tertiary" size="small">
                        <Translation id="TR_CONTACT_SUPPORT" />
                    </Button>
                </TrezorLink>
            </ContactSupport>
        </CollapsibleBox>
    );
};
