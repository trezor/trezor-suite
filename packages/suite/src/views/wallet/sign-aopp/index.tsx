import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, Textarea, Card } from '@trezor/components';
import { useForm, useController } from 'react-hook-form';
import { WalletLayout, WalletLayoutHeader } from '@wallet-components';
import { Translation } from '@suite-components';
import { useActions, useDevice, useSelector, useTranslation } from '@suite-hooks';
import { sign as signAction } from '@wallet-actions/signVerifyActions';
import SignAddressInput from '../sign-verify/components/SignAddressInput';
import { submitProof, validateUri } from './aopp';
import {
    AddressItem,
    useSignAddressOptions,
} from '@suite/hooks/wallet/sign-verify/useSignAddressOptions';

const Row = styled.div`
    display: flex;
    justify-content: center;
    & + & {
        padding-top: 12px;
    }
`;

const StyledButton = styled(Button)`
    width: 230px;
`;

const Form = styled.form`
    padding: 42px;
`;

type AoppFields = {
    uri: string;
    address: string;
    path: string;
};

const DEFAULT_VALUES: AoppFields = {
    uri: '',
    address: '',
    path: '',
};

const SignAopp = () => {
    const [addressUsed, setAddressUsed] = useState<AddressItem | null>(null);
    const { selectedAccount, revealedAddresses } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        revealedAddresses: state.wallet.receive,
    }));

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        clearErrors,
        control,
    } = useForm<AoppFields>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: DEFAULT_VALUES,
    });

    const { isLocked } = useDevice();
    const { translationString } = useTranslation();

    const { field: pathField } = useController({
        control,
        name: 'path',
        rules: {
            required: translationString('TR_SELL_VALIDATION_ERROR_EMPTY'),
        },
    });

    const { getValue } = useSignAddressOptions(selectedAccount.account, revealedAddresses);

    const pathFieldAttrs = {
        value: pathField.value,
        onBlur: pathField.onBlur,
        onChange: (addr: { path: string; address: string } | null) => {
            clearErrors(['path', 'address']);
            pathField.onChange(addr?.path || '');
            setAddressUsed(getValue(addr?.path || ''));
        },
        isDisabled: selectedAccount.account?.networkType === 'ethereum',
    };

    const { sign } = useActions({
        sign: signAction,
    });

    const uriRef = register({
        validate: v =>
            validateUri(v, selectedAccount.account?.networkType)
                ? undefined
                : translationString('TR_UNEXPECTED_AOPP_URI'),
    });

    const onSubmit = async (data: AoppFields) => {
        const { path, uri } = data;
        const msg = new URL(uri.replace(/\s/g, '')).searchParams.get('msg');
        if (msg) {
            const result = await sign(path, msg, false);
            if (result?.signSignature) {
                let address;
                let signature = result.signSignature;
                switch (selectedAccount.account?.networkType) {
                    case 'bitcoin':
                        address = addressUsed?.label;
                        break;
                    case 'ethereum':
                        address = selectedAccount.account?.descriptor;
                        signature = Buffer.from(signature, 'hex').toString('base64');
                        break;
                    default:
                        break;
                }
                if (address) await submitProof(uri, address, signature);
            }
        }
    };

    const formErrors = {
        uri: errors.uri?.message,
        address: errors.address?.message,
        path: errors.path?.message,
    };

    const errorState = (err?: string) => (err ? 'error' : undefined);

    useEffect(() => {
        const overrideValues =
            selectedAccount.account?.networkType === 'ethereum'
                ? {
                      path: selectedAccount.account.path,
                  }
                : {};
        reset({
            ...DEFAULT_VALUES,
            ...overrideValues,
        });
    }, [reset, selectedAccount.account]);

    return (
        <WalletLayout title="TR_NAV_SIGN_AOPP" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_SIGN_AOPP" />
            <Card noPadding>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                        <Textarea
                            name="uri"
                            label={<Translation id="TR_AOPP_URI" />}
                            innerRef={uriRef}
                            state={errorState(formErrors.uri)}
                            bottomText={formErrors.uri}
                            rows={2}
                            maxRows={2}
                        />
                    </Row>
                    <Row>
                        <SignAddressInput
                            name="path"
                            label={<Translation id="TR_ADDRESS" />}
                            account={selectedAccount.account}
                            revealedAddresses={revealedAddresses}
                            error={formErrors.path}
                            {...pathFieldAttrs}
                        />
                    </Row>
                    <Row>
                        <StyledButton type="submit" isDisabled={isLocked()}>
                            <Translation id="TR_SIGN_AND_SUBMIT" />
                        </StyledButton>
                    </Row>
                </Form>
            </Card>
        </WalletLayout>
    );
};

export default SignAopp;
