import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import TrezorConnect, { TokenInfo } from 'trezor-connect';
import { Input, Button } from '@trezor/components';
import * as tokenActions from '@wallet-actions/tokenActions';
import { Modal, QuestionTooltip } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { useActions, useSelector, useTranslation, useAnalytics } from '@suite-hooks';
import { isAddressValid } from '@wallet-utils/validation';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 24px 0px;
`;
const Actions = styled.div`
    display: flex;
    justify-content: center;
`;
interface Props {
    onCancel: () => void;
}

const AddToken = (props: Props) => {
    const [contractAddress, setContractAddress] = useState<string>('');
    const [tokenInfo, setTokenInfo] = useState<TokenInfo[] | undefined>(undefined);
    const [isFetching, setIsFetching] = useState(false);
    const { translationString } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const { addToken } = useActions({
        addToken: tokenActions.addToken,
    });
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { account } = selectedAccount;
    const analytics = useAnalytics();

    const loadTokenInfo = useCallback(
        async (acc: Account, contractAddress: string) => {
            if (!acc) return;
            setIsFetching(true);
            const response = await TrezorConnect.getAccountInfo({
                coin: acc.symbol,
                descriptor: acc.descriptor,
                details: 'tokenBalances',
                contractFilter: contractAddress,
            });

            if (response.success) {
                const isInvalidToken = response.payload.tokens?.find(
                    t => t.address === t.name && t.decimals === 0 && !t.symbol,
                );
                if (!isInvalidToken) {
                    setTokenInfo(response.payload.tokens);
                } else {
                    // not a valid token
                    setError(translationString('TR_ADD_TOKEN_TOKEN_NOT_VALID'));
                }
            } else {
                setTokenInfo(undefined);
                setError(
                    translationString('TR_ADD_TOKEN_TOAST_ERROR', {
                        error: response.payload.error,
                    }),
                );
            }
            setIsFetching(false);
        },
        [translationString],
    );

    useEffect(() => {
        if (account && !error && contractAddress) {
            loadTokenInfo(account, contractAddress);
        }
    }, [account, contractAddress, error, loadTokenInfo]);

    // it shouldn't be possible to open this modal without having selected account
    if (!account) return null;

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const addr = e.target.value;

        const alreadyAdded = account.tokens?.find(
            t => t.address.toLowerCase() === addr.toLowerCase(),
        );

        const isValid = isAddressValid(addr, account.symbol);

        if (addr && !isValid) {
            setError(translationString('TR_ADD_TOKEN_ADDRESS_NOT_VALID'));
        } else if (alreadyAdded) {
            setError(translationString('TR_ADD_TOKEN_ADDRESS_DUPLICATE'));
        } else {
            setError(null);
        }
        setTokenInfo(undefined);
        setContractAddress(addr);
    };

    const getInputState = () => {
        if (error) return 'error';
        if (contractAddress && !isFetching) return 'success';
        return undefined;
    };

    return (
        <Modal
            cancelable
            onCancel={props.onCancel}
            heading={<Translation id="TR_ADD_TOKEN_TITLE" />}
        >
            <Wrapper>
                <Input
                    label={
                        <QuestionTooltip
                            label={<Translation id="TR_ADD_TOKEN_LABEL" />}
                            tooltip="TR_ADD_TOKEN_TOOLTIP"
                        />
                    }
                    placeholder={translationString('TR_ADD_TOKEN_PLACEHOLDER')}
                    value={contractAddress}
                    bottomText={error}
                    state={getInputState()}
                    onChange={onChange}
                />
            </Wrapper>

            <Actions>
                <Button
                    onClick={() => {
                        if (tokenInfo) {
                            addToken(account, tokenInfo);
                            props.onCancel();
                            analytics.report({
                                type: 'add-token',
                                payload: {
                                    networkSymbol: account.symbol,
                                    addedNth: account.tokens ? account.tokens.length + 1 : 0,
                                },
                            });
                        }
                    }}
                    isDisabled={!tokenInfo || !!error}
                    isLoading={isFetching}
                >
                    <Translation id="TR_ADD_TOKEN_SUBMIT" />
                </Button>
            </Actions>
        </Modal>
    );
};

export default AddToken;
