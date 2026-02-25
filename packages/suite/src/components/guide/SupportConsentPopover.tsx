import { ReactNode, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSupportChatUrl } from '@suite-common/support';
import { Button, Card, Checkbox, Column, Paragraph, Popover } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

const ElevatedCardWrapper = styled.div`
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
`;

type SupportConsentPopoverProps = {
    children: ReactNode;
};

export const SupportConsentPopover = ({ children }: SupportConsentPopoverProps) => {
    const [isSystemInfoShared, setIsSystemInfoShared] = useState(false);
    const supportChatUrl = useSelector(state => selectSupportChatUrl(state, isSystemInfoShared));

    return (
        <Popover
            popoverOffset={-5}
            placement={{ position: 'bottom', alignment: 'start' }}
            content={
                <ElevatedCardWrapper>
                    <Card paddingType="small" width="320px">
                        <Column gap={12}>
                            <Paragraph typographyStyle="body-md" intent="neutral">
                                <Translation id="TR_GUIDE_SUPPORT_CONSENT_TITLE" />
                            </Paragraph>
                            <Column gap={8}>
                                <Card paddingType="small">
                                    <Checkbox
                                        isChecked={isSystemInfoShared}
                                        onClick={() => setIsSystemInfoShared(prev => !prev)}
                                        data-testid="@guide/support/share-system-info"
                                    >
                                        <Translation id="TR_GUIDE_SUPPORT_CONSENT_TOGGLE" />
                                    </Checkbox>
                                </Card>
                                <Paragraph
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_GUIDE_SUPPORT_CONSENT_DESCRIPTION" />
                                </Paragraph>
                            </Column>
                            <Button
                                iconRight="arrowUpRight"
                                onClick={() => window.open(supportChatUrl, '_blank')}
                                width="100%"
                            >
                                <Translation id="TR_GUIDE_SUPPORT_CONSENT_BUTTON" />
                            </Button>
                        </Column>
                    </Card>
                </ElevatedCardWrapper>
            }
        >
            {children}
        </Popover>
    );
};
