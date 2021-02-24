import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Input, Button, Textarea, variables } from '@trezor/components';
import Title from '@wallet-components/Title';
import { WalletLayout } from '@wallet-components';
import * as signVerifyActions from '@wallet-actions/signVerifyActions';
import { Translation } from '@suite-components/Translation';
import { useActions, useSelector } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    background: ${props => props.theme.BG_WHITE};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-wrap: wrap;
    }
`;

const Row = styled.div`
    padding-bottom: 28px;
`;

const RowButtons = styled(Row)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    width: 110px;
    margin-left: 10px;

    &:first-child {
        margin-left: 0;
    }
`;

const Column = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;

const Sign = styled(Column)``;

const Verify = styled(Column)`
    padding-left: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding-left: 0px;
    }
`;

type InputNameType = Parameters<typeof signVerifyActions.inputChange>;

const SignVerify = () => {
    const { signVerify, selectedAccount } = useSelector(state => ({
        signVerify: state.wallet.signVerify,
        selectedAccount: state.wallet.selectedAccount,
    }));
    const { inputChange, clearSign, clearVerify, verify } = useActions({
        inputChange: signVerifyActions.inputChange,
        clearSign: signVerifyActions.clearSign,
        clearVerify: signVerifyActions.clearVerify,
        verify: signVerifyActions.verify,
    });

    const getError = useCallback(
        (inputName: string) => {
            if (!signVerify) return null;
            return signVerify.errors.find(e => e.inputName === inputName);
        },
        [signVerify],
    );

    const handleInputChange = useCallback(
        ({ target }) => {
            inputChange(target.name as InputNameType[0], target.value);
        },
        [inputChange],
    );

    const verifyAddressError = getError('verifyAddress');

    return (
        <WalletLayout title="TR_NAV_SIGN_VERIFY" account={selectedAccount}>
            <Wrapper>
                <Sign>
                    <Title>
                        <Translation id="TR_SIGN_MESSAGE" />
                    </Title>
                    <Row>
                        <Input
                            label={<Translation id="TR_ADDRESS" />}
                            name="signAddress"
                            value=""
                            // value={account.descriptor}
                            type="text"
                            readOnly
                        />
                    </Row>
                    <Row>
                        <Textarea
                            label={<Translation id="TR_MESSAGE" />}
                            name="signMessage"
                            value={signVerify.signMessage}
                            onChange={handleInputChange}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                        />
                    </Row>
                    <Row>
                        <Textarea
                            label={<Translation id="TR_SIGNATURE" />}
                            name="signSignature"
                            value={signVerify.signSignature}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                            readOnly
                        />
                    </Row>
                    <RowButtons>
                        <StyledButton onClick={clearSign} variant="secondary">
                            <Translation id="TR_CLEAR" />
                        </StyledButton>
                        <StyledButton
                            // isDisabled={!device.connected}
                            isDisabled={false}
                            // TODO:
                            // onClick={() =>
                            //      signVerifyActions.sign(account.accountPath, signMessage)
                            // }
                        >
                            <Translation id="TR_SIGN" />
                        </StyledButton>
                    </RowButtons>
                </Sign>
                <Verify>
                    <Title>
                        <Translation id="TR_VERIFY_MESSAGE" />
                    </Title>
                    <Row>
                        <Input
                            label={<Translation id="TR_ADDRESS" />}
                            name="verifyAddress"
                            value={signVerify.verifyAddress}
                            onChange={handleInputChange}
                            type="text"
                            state={verifyAddressError ? 'error' : undefined}
                            bottomText={verifyAddressError ? verifyAddressError.message : null}
                        />
                    </Row>
                    <Row>
                        <Textarea
                            label={<Translation id="TR_MESSAGE" />}
                            name="verifyMessage"
                            value={signVerify.verifyMessage}
                            onChange={handleInputChange}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                        />
                    </Row>
                    <Row>
                        <Textarea
                            label={<Translation id="TR_SIGNATURE" />}
                            name="verifySignature"
                            value={signVerify.verifySignature}
                            onChange={handleInputChange}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                        />
                    </Row>
                    <RowButtons>
                        <StyledButton onClick={clearVerify}>
                            <Translation id="TR_CLEAR" />
                        </StyledButton>
                        <StyledButton
                            // isDisabled={!!verifyAddressError || !device.connected}
                            isDisabled
                            onClick={() => {
                                if (signVerify.errors.length <= 0) {
                                    verify(
                                        signVerify.verifyAddress,
                                        signVerify.verifyMessage,
                                        signVerify.verifySignature,
                                    );
                                }
                            }}
                        >
                            <Translation id="TR_VERIFY" />
                        </StyledButton>
                    </RowButtons>
                </Verify>
            </Wrapper>
        </WalletLayout>
    );
};

export default SignVerify;
