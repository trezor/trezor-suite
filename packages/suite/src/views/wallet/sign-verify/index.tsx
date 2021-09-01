import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm, useController } from 'react-hook-form';
import { Input, Button, Textarea, Card, Switch, variables } from '@trezor/components';
import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { Translation } from '@suite-components';
import { useActions, useDevice, useSelector, useTranslation } from '@suite-hooks';
import { isHex } from '@wallet-utils/ethUtils';
import { isAddressValid } from '@wallet-utils/validation';
import { sign as signAction, verify as verifyAction } from '@wallet-actions/signVerifyActions';
import Navigation, { NavPages } from './components/Navigation';
import SignAddressInput from './components/SignAddressInput';

const MAX_LENGTH_MESSAGE = 255;
const MAX_LENGTH_SIGNATURE = 255;

const Row = styled.div`
    display: flex;
    justify-content: center;
    & + & {
        padding-top: 12px;
    }
`;

const StyledButton = styled(Button)`
    width: 110px;
    margin-left: 10px;

    &:first-child {
        margin-left: 0;
    }
`;

const SwitchWrapper = styled.label`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    align-items: center;
    height: 100%;
    & > * + * {
        margin-left: 10px;
    }
`;

const Form = styled.form`
    padding: 42px;
`;

type SignVerifyFields = {
    message: string;
    address: string;
    path: string;
    signature: string;
    hex: boolean;
};

const SignVerify = () => {
    const [page, setPage] = useState<NavPages>('sign');

    const { selectedAccount, revealedAddresses } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        revealedAddresses: state.wallet.receive,
    }));

    const { isLocked } = useDevice();

    const { sign, verify } = useActions({
        sign: signAction,
        verify: verifyAction,
    });

    const { translationString } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        clearErrors,
        control,
        trigger,
    } = useForm<SignVerifyFields>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            message: '',
            address: '',
            path: '',
            signature: '',
            hex: false,
        },
    });

    const onSubmit = async (data: SignVerifyFields) => {
        const { address, path, message, signature, hex } = data;
        if (page === 'sign') {
            const result = await sign(path, message, hex);
            if (result?.signSignature) setValue('signature', result.signSignature);
        } else {
            await verify(address, message, signature, hex);
        }
    };

    const changePage = (newPage: NavPages) => {
        if (newPage !== page) {
            reset();
            setPage(newPage);
        }
    };

    const { field: addressField } = useController({
        control,
        name: 'address',
        rules: {
            required: translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
            validate: (address: string) =>
                selectedAccount.account?.symbol &&
                !isAddressValid(address, selectedAccount.account.symbol)
                    ? translationString('TR_ADD_TOKEN_ADDRESS_NOT_VALID')
                    : undefined,
        },
    });

    const { field: pathField } = useController({
        control,
        name: 'path',
        rules: {
            required: page === 'sign' && translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
        },
    });

    const { field: hexField } = useController({
        control,
        name: 'hex',
    });

    useEffect(() => {
        trigger('message');
    }, [trigger, hexField.value]);

    return (
        <WalletLayout title="TR_NAV_SIGN_VERIFY" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_SIGN_VERIFY" />
            <Card noPadding>
                <Navigation page={page} setPage={changePage} />
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                        <Textarea
                            name="message"
                            label={<Translation id="TR_MESSAGE" />}
                            labelRight={
                                <SwitchWrapper>
                                    <Translation id="TR_HEX_FORMAT" />
                                    <Switch
                                        checked={hexField.value}
                                        onChange={hexField.onChange}
                                        isSmall
                                    />
                                </SwitchWrapper>
                            }
                            maxLength={MAX_LENGTH_MESSAGE}
                            innerRef={register({
                                maxLength: MAX_LENGTH_MESSAGE,
                                validate: (message: string) =>
                                    hexField.value && !isHex(message)
                                        ? translationString('DATA_NOT_VALID_HEX')
                                        : undefined,
                            })}
                            state={errors.message && 'error'}
                            bottomText={errors.message?.message}
                            rows={4}
                            maxRows={4}
                        />
                    </Row>
                    <Row>
                        {page === 'sign' ? (
                            <SignAddressInput
                                name="path"
                                label={<Translation id="TR_ADDRESS" />}
                                account={selectedAccount.account}
                                revealedAddresses={revealedAddresses}
                                value={pathField.value}
                                onChange={addr => {
                                    clearErrors(['path', 'address']);
                                    pathField.onChange(addr?.path || '');
                                    addressField.onChange(addr?.address || '');
                                }}
                                onBlur={pathField.onBlur}
                                error={errors.path?.message || errors.address?.message}
                            />
                        ) : (
                            <Input
                                name="address"
                                label={<Translation id="TR_ADDRESS" />}
                                type="text"
                                state={errors.address && 'error'}
                                bottomText={errors.address?.message}
                                value={addressField.value}
                                onChange={addressField.onChange}
                                onBlur={addressField.onBlur}
                            />
                        )}
                    </Row>
                    <Row>
                        <Textarea
                            name="signature"
                            label={<Translation id="TR_SIGNATURE" />}
                            maxLength={MAX_LENGTH_SIGNATURE}
                            innerRef={register({
                                required: {
                                    value: page === 'verify',
                                    message: translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
                                },
                            })}
                            readOnly={page === 'sign'}
                            state={errors.signature && 'error'}
                            bottomText={errors.signature?.message}
                            rows={4}
                            maxRows={4}
                        />
                    </Row>
                    <Row>
                        <StyledButton type="button" onClick={() => reset()} variant="secondary">
                            <Translation id="TR_CLEAR" />
                        </StyledButton>
                        <StyledButton
                            type="submit"
                            isDisabled={isLocked()}
                            data-test="@sign-verify/submit"
                        >
                            <Translation id={page === 'sign' ? 'TR_SIGN' : 'TR_VERIFY'} />
                        </StyledButton>
                    </Row>
                </Form>
            </Card>
        </WalletLayout>
    );
};

export default SignVerify;
