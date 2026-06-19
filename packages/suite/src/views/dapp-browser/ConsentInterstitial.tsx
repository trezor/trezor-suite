import styled from 'styled-components';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { Translation } from '@suite/intl';
import { Button, Card, Paragraph } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: ${spacingsPx.xl};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.lg};
    max-width: 520px;
`;

const Actions = styled.div`
    display: flex;
    gap: ${spacingsPx.sm};
    justify-content: flex-end;
`;

type ConsentInterstitialProps = {
    entry: DappCatalogEntry;
    isLoading: boolean;
    onContinue: () => void;
    onCancel: () => void;
};

// The §6 third-party consent interstitial, shown before a "general" (non
// Trezor-integrated) dApp is opened. The disclaimer copy is fixed.
export const ConsentInterstitial = ({
    entry,
    isLoading,
    onContinue,
    onCancel,
}: ConsentInterstitialProps) => (
    <Wrapper>
        <Content>
            <Card>
                <Paragraph typographyStyle="headline-sm">
                    <Translation
                        id="TR_DAPP_BROWSER_CONSENT_HEADING"
                        values={{ dappName: entry.name }}
                    />
                </Paragraph>
                <Paragraph intent="warning">
                    <Translation id="TR_DAPP_BROWSER_CONSENT_DISCLAIMER" />
                </Paragraph>
                <Paragraph>
                    <Translation id="TR_DAPP_BROWSER_CONSENT_VERIFY" />
                </Paragraph>
            </Card>
            <Actions>
                <Button intent="neutral" priority="secondary" onClick={onCancel}>
                    <Translation id="TR_DAPP_BROWSER_CONSENT_CANCEL" />
                </Button>
                <Button onClick={onContinue} isLoading={isLoading} isDisabled={isLoading}>
                    <Translation id="TR_DAPP_BROWSER_CONSENT_CONTINUE" />
                </Button>
            </Actions>
        </Content>
    </Wrapper>
);
