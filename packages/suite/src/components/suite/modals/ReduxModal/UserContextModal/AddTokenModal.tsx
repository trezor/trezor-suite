import { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { selectSelectedAccount } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { selectAddressValidatorDep } from '@suite-common/address';
import { useServices } from '@suite-common/dependency-injection';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { Input, Modal } from '@trezor/components';
import TrezorConnect, { type TokenInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { addToken } from 'src/actions/wallet/tokenActions';
import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

type AddTokenModalProps = {
    onCancel: () => void;
};

export const AddTokenModal = ({ onCancel }: AddTokenModalProps) => {
    const [contractAddress, setContractAddress] = useState<string>('');
    const [tokenInfo, setTokenInfo] = useState<TokenInfo[] | undefined>(undefined);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { analytics, addressValidator } = useServices(
        selectDesktopAnalyticsDep,
        selectAddressValidatorDep,
    );

    const loadTokenInfo = useCallback(
        async (acc: Account, contractAddress: string) => {
            if (!acc) return;
            setIsFetching(true);
            const response = await TrezorConnect.getAccountInfo({
                coin: asCoinSymbol(acc.symbol),
                identity: tryGetAccountIdentity(acc),
                descriptor: acc.descriptor,
                details: 'tokenBalances',
                contractFilter: contractAddress,
                suppressBackupWarning: true,
                protocols: acc.networkType === 'ethereum' ? ['erc4626'] : undefined,
            });

            if (response.success) {
                const isInvalidToken = response.payload.tokens?.find(
                    t => t.contract === t.name && t.decimals === 0 && !t.symbol,
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
                        error: response.error.message,
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

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const addr = e.target.value;

        const alreadyAdded = account.tokens?.find(
            t => t.contract.toLowerCase() === addr.toLowerCase(),
        );

        const isValid = addressValidator.isAddressValid(addr, account.symbol);

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
    const handleAddTokenButtonClick = () => {
        if (tokenInfo) {
            dispatch(addToken(account, tokenInfo));
            onCancel();

            analytics.report({
                type: events.addTokenEvent.name,
                payload: {
                    networkSymbol: account.symbol,
                    addedNth: account.tokens ? account.tokens.length + 1 : 0,
                    token: tokenInfo[0]?.symbol || '',
                },
            });
        }
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_ADD_TOKEN_TITLE" />}
            bottomContent={
                <Modal.Button
                    onClick={handleAddTokenButtonClick}
                    isDisabled={!tokenInfo || !!error}
                    isLoading={isFetching}
                >
                    <Translation id="TR_ADD_TOKEN_SUBMIT" />
                </Modal.Button>
            }
        >
            <Input
                label={<Translation id="TR_ADD_TOKEN_LABEL" />}
                value={contractAddress}
                bottomText={error || null}
                hasError={!!error}
                onChange={onChange}
            />
        </Modal>
    );
};
