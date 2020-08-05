import { Button, Modal } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Text = styled.div``;
const ButtonArea = styled.div``;
const Terms = styled.div``;

const CoinmarketTerms = () => (
    <Modal size="small">
        <Terms>
            <Text>
                I'm here to buy cryptocurrency. If you were directed to this site for any other
                reason, please contact Simplex support before proceeding.
            </Text>
            <Text>
                I'm using Invity to purchase funds that will be sent to an account under my direct
                personal control.
            </Text>
            <Text>
                I'm not using Invity for gambling or any other violation of Invity’s Terms of
                service.
            </Text>
            <Text>
                I understand that cryptocurrencies are an emerging financial tool and that
                regulations may be limited in some areas. This may put me at a higher risk of fraud,
                theft, or market instability.
            </Text>
            <Text>
                I understand that cryptocurrency transactions are irreversible and I won’t be able
                to receive a refund for my purchase.
            </Text>
        </Terms>
        <ButtonArea>
            <Button>Confirm</Button>
        </ButtonArea>
    </Modal>
);

export default CoinmarketTerms;
