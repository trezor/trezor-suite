import { useCallback, useEffect, useState, ChangeEvent } from 'react';
import TrezorConnect, { TokenInfo } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';

import { Input, Button, Tooltip } from '@trezor/components';
import { addToken } from 'src/actions/wallet/tokenActions';
import { Modal } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { isAddressValid } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

interface AddTokenModalProps {
    onCancel: () => void;
}

export const AddTokenModal = ({ onCancel }: AddTokenModalProps) => {
    const [contractAddress, setContractAddress] = useState<string>('');
    const [tokenInfo, setTokenInfo] = useState<TokenInfo[] | undefined>(undefined);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const account = useSelector(selectSelectedAccount);
    const localCurrency = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const loadTokenInfo = useCallback(
        async (acc: Account, contractAddress: string) => {
            if (!acc) return;
            setIsFetching(true);
            const response = await TrezorConnect.getAccountInfo({
                coin: acc.symbol,
                descriptor: acc.descriptor,
                details: 'tokenBalances',
                contractFilter: contractAddress,
                suppressBackupWarning: true,
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

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const addr = e.target.value;

        const alreadyAdded = account.tokens?.find(
            t => t.contract.toLowerCase() === addr.toLowerCase(),
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
        return undefined;
    };

    const handleAddTokenButtonClick = () => {
        if (tokenInfo) {
            dispatch(addToken(account, tokenInfo, localCurrency));
            onCancel();

            analytics.report({
                type: EventType.AddToken,
                payload: {
                    networkSymbol: account.symbol,
                    addedNth: account.tokens ? account.tokens.length + 1 : 0,
                    token: tokenInfo[0]?.symbol?.toLowerCase() || '',
                },
            });
        }
    };

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_ADD_TOKEN_TITLE" />}
            bottomBarComponents={
                <Button
                    onClick={handleAddTokenButtonClick}
                    isDisabled={!tokenInfo || !!error}
                    isLoading={isFetching}
                >
                    <Translation id="TR_ADD_TOKEN_SUBMIT" />
                </Button>
            }
        >
            <Input
                label={
                    <Tooltip content={<Translation id="TR_ADD_TOKEN_TOOLTIP" />} dashed>
                        <Translation id="TR_ADD_TOKEN_LABEL" />
                    </Tooltip>
                }
                placeholder={translationString('TR_ADD_TOKEN_PLACEHOLDER')}
                value={contractAddress}
                bottomText={error || null}
                inputState={getInputState()}
                onChange={onChange}
                hasBottomPadding={false}
            />
        </Modal>
    );
};
