import { Button, Text, Icon, Warning, Card } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { PassphraseHeading } from './PassphraseHeading';
import { PassphraseList, PassphraseItem } from './PassphraseList';
import { ContentType } from './types';
import { Dispatch } from 'react';

type PassphraseWalletConfirmationStep2Props = {
    setContentType: Dispatch<React.SetStateAction<ContentType>>;
};

export const PassphraseWalletConfirmationStep2 = ({
    setContentType,
}: PassphraseWalletConfirmationStep2Props) => (
    <>
        <PassphraseHeading>
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_TITLE" />
        </PassphraseHeading>
        <Card paddingType="small">
            <PassphraseList>
                <PassphraseItem>
                    <Icon icon="NEWSPAPER" size={16} />
                    <Text>
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM1_DESCRIPTION" />
                    </Text>
                </PassphraseItem>
                <PassphraseItem>
                    <Icon icon="COPY" size={16} />
                    <Text>
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM2_DESCRIPTION" />
                    </Text>
                </PassphraseItem>
                <PassphraseItem>
                    <Icon icon="HIDE" size={16} />
                    <Text>
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION" />
                    </Text>
                </PassphraseItem>
            </PassphraseList>
            <Warning>
                <Text variant="warning" typographyStyle="callout">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING" />
                </Text>
            </Warning>
        </Card>

        <Button
            isFullWidth
            onClick={() => {
                setContentType('step3');
            }}
            margin={{ top: 12 }}
            data-testid="@passphrase-confirmation/step2-button"
        >
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_BUTTON" />
        </Button>
    </>
);
