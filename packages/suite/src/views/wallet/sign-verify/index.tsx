import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Input, Button, Textarea, colors, variables } from '@trezor/components';
import Title from '@wallet-components/Title';
import { WalletLayout } from '@wallet-components';
import * as signVerifyActions from '@wallet-actions/signVerifyActions';
import { Translation } from '@suite-components/Translation';
import { StateProps, DispatchProps } from './Container';
import { useDevice } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    background: ${colors.WHITE};

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

interface Props {
    selectedAccount: StateProps['selectedAccount'];
    signVerify: StateProps['signVerify'];
    signVerifyActions: DispatchProps['signVerifyActions'];
}

interface FormEvent {
    target: {
        name: string;
        value: string;
    };
}

type InputNameType = Parameters<typeof signVerifyActions.inputChange>;

const SignVerify = (props: Props) => {
    const {
        selectedAccount,
        signVerifyActions,
        signVerify: {
            signMessage,
            signSignature,
            verifyAddress,
            verifyMessage,
            verifySignature,
            errors,
        },
    } = props;

    useEffect(() => {
        return () => {
            signVerifyActions.clearSign(); // clear inputs after coin change
            signVerifyActions.clearVerify();
        };
    }, [signVerifyActions]);

    const { device, isLocked } = useDevice();
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Sign & Verify" account={selectedAccount} />;
    }

    const getError = (inputName: string) => {
        return errors.find(e => e.inputName === inputName);
    };

    const handleInputChange = (event: FormEvent) => {
        signVerifyActions.inputChange(event.target.name as InputNameType[0], event.target.value);
    };

    const getAddress = () => {
        if (
            selectedAccount.account.networkType === 'bitcoin' &&
            typeof selectedAccount.account.addresses?.unused[0]?.address === 'string' &&
            typeof selectedAccount.account.addresses?.unused[0]?.address === 'string'
        ) {
            return {
                address: selectedAccount.account.addresses.unused[0].address,
                path: selectedAccount.account.addresses.unused[0].path,
            };
        }

        if (selectedAccount.account.networkType === 'ethereum') {
            return {
                address: selectedAccount.account.descriptor,
                path: selectedAccount.account.path,
            };
        }

        return {
            address: '',
            path: '',
        };
    };

    const verifyAddressError = getError('verifyAddress');
    const { address, path } = getAddress();

    return (
        <WalletLayout title="Sign & Verify" account={selectedAccount}>
            <Wrapper>
                <Sign>
                    <Title>
                        <Translation id="TR_SIGN_MESSAGE" />
                    </Title>
                    <Row>
                        <Input
                            topLabel={<Translation id="TR_ADDRESS" />}
                            name="signAddress"
                            value={address}
                            type="text"
                            readOnly
                        />
                    </Row>
                    <Row>
                        <Textarea
                            topLabel={<Translation id="TR_MESSAGE" />}
                            name="signMessage"
                            value={signMessage}
                            onChange={handleInputChange}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                        />
                    </Row>
                    <Row>
                        <Textarea
                            topLabel={<Translation id="TR_SIGNATURE" />}
                            name="signSignature"
                            value={signSignature}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                            readOnly
                        />
                    </Row>
                    <RowButtons>
                        <StyledButton onClick={signVerifyActions.clearSign} variant="secondary">
                            <Translation id="TR_CLEAR" />
                        </StyledButton>
                        <StyledButton
                            isDisabled={signMessage.length <= 0 || !isLocked || path.length <= 0}
                            onClick={() => signVerifyActions.sign(signMessage, path)}
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
                            topLabel={<Translation id="TR_ADDRESS" />}
                            name="verifyAddress"
                            value={verifyAddress}
                            onChange={handleInputChange}
                            type="text"
                            state={verifyAddressError ? 'error' : undefined}
                            bottomText={
                                verifyAddressError ? (
                                    <Translation id={verifyAddressError.message} />
                                ) : null
                            }
                        />
                    </Row>
                    <Row>
                        <Textarea
                            topLabel={<Translation id="TR_MESSAGE" />}
                            name="verifyMessage"
                            value={verifyMessage}
                            onChange={handleInputChange}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                        />
                    </Row>
                    <Row>
                        <Textarea
                            topLabel={<Translation id="TR_SIGNATURE" />}
                            name="verifySignature"
                            value={verifySignature}
                            onChange={handleInputChange}
                            rows={4}
                            maxRows={4}
                            maxLength={255}
                        />
                    </Row>
                    <RowButtons>
                        <StyledButton onClick={signVerifyActions.clearVerify}>
                            <Translation id="TR_CLEAR" />
                        </StyledButton>
                        <StyledButton
                            isDisabled={
                                verifySignature.length <= 0 ||
                                verifyMessage.length <= 0 ||
                                verifyAddress.length <= 0 ||
                                !isLocked
                            }
                            onClick={() => {
                                if (errors.length <= 0) {
                                    signVerifyActions.verify(
                                        verifyAddress,
                                        verifyMessage,
                                        verifySignature.trim(),
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
