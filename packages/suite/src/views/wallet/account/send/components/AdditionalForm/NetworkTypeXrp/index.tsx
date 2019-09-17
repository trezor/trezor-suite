import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Input, Tooltip, Icon, colors } from '@trezor/components';
import sendMessages from '@wallet-views/account/messages';
import commonMessages from '@wallet-views/messages';
import localMessages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
    padding-left: 5px;
    height: 100%;
`;

const NetworkTypeXrp = () => (
    <Wrapper>
        <Row>
            <Input
                state={undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                topLabel={
                    <Label>
                        <FormattedMessage {...sendMessages.TR_FEE} />
                        <Tooltip
                            content={<FormattedMessage {...localMessages.TR_XRP_TRANSFER_COST} />}
                            maxWidth={200}
                            ctaLink="https://developers.ripple.com/transaction-cost.html"
                            ctaText={<FormattedMessage {...commonMessages.TR_LEARN_MORE} />}
                            placement="top"
                        >
                            <StyledIcon icon="HELP" color={colors.TEXT_SECONDARY} size={12} />
                        </Tooltip>
                    </Label>
                }
                bottomText=""
                value=""
                onChange={() => {}}
            />
        </Row>
        <Row>
            <Input
                state={undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                topLabel={
                    <Label>
                        <FormattedMessage {...localMessages.TR_XRP_DESTINATION_TAG} />
                        <Tooltip
                            content={
                                <FormattedMessage
                                    {...localMessages.TR_XRP_DESTINATION_TAG_EXPLAINED}
                                />
                            }
                            maxWidth={200}
                            ctaLink="https://wiki.trezor.io/Ripple_(XRP)"
                            ctaText={<FormattedMessage {...commonMessages.TR_LEARN_MORE} />}
                            placement="top"
                        >
                            <StyledIcon icon="HELP" color={colors.TEXT_SECONDARY} size={12} />
                        </Tooltip>
                    </Label>
                }
                bottomText=""
                value=""
                onChange={() => {}}
            />
        </Row>
    </Wrapper>
);

export default NetworkTypeXrp;
