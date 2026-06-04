import { useState } from 'react';

import { File } from 'expo-file-system';

import { bip329LabelSchema, selectBip329Dep } from '@suite-common/bip329-types';
import { useServices } from '@suite-common/dependency-injection';
import { parseJsonl } from '@suite-common/jsonl';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useSuiteSyncErrorHandler } from '@suite-native/suite-sync';
import { useToast } from '@suite-native/toasts';
import { type StaticSessionId } from '@trezor/device-utils';

type Bip329ImportButtonProps = {
    accountDescriptor: AccountDescriptor;
    deviceStaticSessionId: StaticSessionId;
};

export const Bip329ImportButton = ({
    accountDescriptor,
    deviceStaticSessionId,
}: Bip329ImportButtonProps) => {
    const [isImporting, setIsImporting] = useState(false);
    const { showToast } = useToast();
    const { bip329 } = useServices(selectBip329Dep);
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();

    const handleImport = async () => {
        setIsImporting(true);

        let content: string;
        try {
            const picked = await File.pickFileAsync();
            const file = Array.isArray(picked) ? picked[0] : picked;

            if (!file) {
                setIsImporting(false);

                return;
            }

            content = await file.text();
        } catch {
            showToast({
                intent: 'critical',
                message: (
                    <Translation id="moduleAccounts.accountSettingsBip329.import.importFailedToast" />
                ),
            });
            setIsImporting(false);

            return;
        }

        const parsed = parseJsonl(content, bip329LabelSchema);

        if (!parsed.success) {
            showToast({
                intent: 'critical',
                message: (
                    <Translation id="moduleAccounts.accountSettingsBip329.import.invalidFileToast" />
                ),
            });
            setIsImporting(false);

            return;
        }

        const result = await bip329.import({
            deviceStaticSessionId,
            accountDescriptor,
            bip329Labels: parsed.payload,
        });

        if (!result.success) {
            handleSuiteSyncError(result.error);
            setIsImporting(false);

            return;
        }

        showToast({
            intent: 'neutral',
            icon: 'copy',
            message: (
                <Translation id="moduleAccounts.accountSettingsBip329.import.importSuccessfulToast" />
            ),
        });
        setIsImporting(false);
    };

    return (
        <Button
            size="medium"
            onPress={handleImport}
            intent="neutral"
            priority="secondary"
            isLoading={isImporting}
            isDisabled={isImporting}
        >
            <Translation id="moduleAccounts.accountSettingsBip329.importButton" />
        </Button>
    );
};
