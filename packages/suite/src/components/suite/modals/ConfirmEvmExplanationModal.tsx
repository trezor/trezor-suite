import styled from 'styled-components';

import { Translation, TranslationKey } from '@suite/intl';
import { onCancel } from '@suite/modal';
import { networks } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Image, Modal, Paragraph } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';

const ImageWrapper = styled.div`
    position: relative;
    width: 97.5%;
`;

const CoinLogoLeft = styled.div<{ $isETH: boolean }>`
    position: absolute;
    top: 20%;
    left: ${({ $isETH }) => ($isETH ? '6.75%' : '5.5%')};
`;

const CoinLogoRight = styled.div`
    position: absolute;
    top: 34%;
    right: 5.5%;
`;

export interface ConfirmNetworkExplanationModalProps {
    account: Account | undefined;
    route: 'wallet-receive' | 'wallet-send';
}

export const ConfirmEvmExplanationModal = ({
    account,
    route,
}: ConfirmNetworkExplanationModalProps) => {
    const dispatch = useDispatch();
    const close = () => {
        dispatch(onCancel());
        if (!account?.symbol) {
            return;
        }
        dispatch({
            type: SUITE.EVM_CONFIRM_EXPLANATION_MODAL,
            symbol: account?.symbol,
            route,
        });
    };
    const confirmExplanationModalClosed = useSelector(
        state => state.suite.evmSettings.confirmExplanationModalClosed,
    );

    if (!account) {
        return null;
    }

    const network = networks[account.symbol];
    const isVisible =
        account.empty &&
        network.networkType === 'ethereum' &&
        !confirmExplanationModalClosed[account.symbol]?.[route];

    if (!isVisible) {
        return null;
    }

    const titleTranslationsIds: Record<typeof route, TranslationKey> = {
        'wallet-receive': 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_TITLE',
        'wallet-send': 'TR_CONFIRM_EVM_EXPLANATION_SEND_TITLE',
    };

    const descriptionTranslationsIds: Record<typeof route, TranslationKey> = {
        'wallet-receive':
            account.symbol === 'eth'
                ? 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_ETH'
                : 'TR_CONFIRM_EVM_EXPLANATION_RECEIVE_DESCRIPTION_OTHER',
        'wallet-send': 'TR_CONFIRM_EVM_EXPLANATION_SEND_DESCRIPTION',
    };

    return (
        <Modal
            bottomContent={
                <Modal.Button onClick={close}>
                    <Translation id="TR_GOT_IT_BUTTON" />
                </Modal.Button>
            }
            width={600}
            heading={
                <Translation
                    id={titleTranslationsIds[route]}
                    values={{
                        network: network.name,
                    }}
                />
            }
        >
            <ImageWrapper>
                <Image
                    image={
                        account.symbol === 'eth'
                            ? 'CONFIRM_EVM_EXPLANATION_ETH'
                            : 'CONFIRM_EVM_EXPLANATION_OTHER'
                    }
                    width="100%"
                />
                <CoinLogoLeft $isETH={account.symbol === 'eth'}>
                    <CoinLogo size={80} symbol={account.symbol} />
                </CoinLogoLeft>
                {account.symbol !== 'eth' && (
                    <CoinLogoRight>
                        <CoinLogo size={80} symbol="eth" />
                    </CoinLogoRight>
                )}
            </ImageWrapper>
            <Paragraph
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                margin={{ top: spacings.xl }}
            >
                <Translation
                    id={descriptionTranslationsIds[route]}
                    values={{
                        network: network.name,
                    }}
                />
            </Paragraph>
        </Modal>
    );
};
