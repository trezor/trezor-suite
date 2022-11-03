import { Button, Icon, variables, Checkbox, H3 } from '@trezor/components';
import React, { useState } from 'react';
import { Translation, Modal } from '@suite-components';
import styled from 'styled-components';
import type { Deferred } from '@trezor/utils';

const Text = styled.div`
    padding-bottom: 20px;
    text-align: left;
    & + & {
        padding-top: 20px;
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

const Header = styled.div`
    display: flex;
    width: 100%;
    padding: 10px 0;
    align-items: baseline;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StyledIcon = styled(Icon)`
    padding-right: 9px;
`;

const CheckText = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
`;

const Footer = styled.div`
    display: flex;
    padding: 35px 0;
    flex: 1;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const FooterContent = styled.div`
    display: flex;
    justify-content: space-between;
    flex: 1;
    padding: 0 35px;
`;

export type Props = {
    decision: Deferred<boolean>;
    onCancel: () => void;
    provider?: string;
};

export const CoinmarketBuyTerms = ({ decision, onCancel, provider }: Props) => {
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const providerName = provider || 'unknown provider';

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={
                <Header>
                    <StyledIcon size={16} icon="LOCK_ACTIVE" />
                    <H3>
                        <Translation id="TR_BUY_FOR_YOUR_SAFETY" />
                    </H3>
                </Header>
            }
        >
            <Text>
                <Translation id="TR_BUY_TERMS_1" values={{ provider: providerName }} />
            </Text>
            <Text>
                <Translation id="TR_BUY_TERMS_2" />
            </Text>
            <Text>
                <Translation id="TR_BUY_TERMS_3" />
            </Text>
            <Text>
                <Translation id="TR_BUY_TERMS_4" />
            </Text>
            <Text>
                <Translation id="TR_BUY_TERMS_5" />
            </Text>
            <Footer>
                <FooterContent>
                    <Checkbox
                        isChecked={isChecked}
                        onClick={() => setIsChecked(!isChecked)}
                        data-test="@coinmarket/buy/offers/buy-terms-agree-checkbox"
                    >
                        <CheckText>
                            <Translation id="TR_BUY_I_UNDERSTAND" />
                        </CheckText>
                    </Checkbox>
                    <Button
                        data-test="@coinmarket/buy/offers/buy-terms-confirm-button"
                        isDisabled={!isChecked}
                        onClick={() => {
                            decision.resolve(true);
                            onCancel();
                        }}
                    >
                        <Translation id="TR_BUY_CONFIRM" />
                    </Button>
                </FooterContent>
            </Footer>
        </Modal>
    );
};
