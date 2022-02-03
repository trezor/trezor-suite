import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DropEvent, DropzoneOptions, FileRejection, useDropzone } from 'react-dropzone';
import type {
    SavingsKYCStartFormState,
    SavingsKYCStartContextValues,
    UseSavingsKYCStartProps,
} from '@wallet-types/coinmarket/savings/KYCStart';

import invityAPI, { SavingsTrade, SavingsTradeUserKYCStart } from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useSavingsKYCStartDefaultValues } from './useSavingsKYCStartDefaultValues';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';

export const useSavingsKYCStart = ({
    selectedAccount,
}: UseSavingsKYCStartProps): SavingsKYCStartContextValues => {
    const { navigateToInvityAML } = useInvityNavigation(selectedAccount.account);
    const { loadInvityData, saveSavingsTradeResponse, startWatchingKYCStatus } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
        startWatchingKYCStatus: coinmarketSavingsActions.startWatchingKYCStatus,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { selectedProvider, isLoading } = useSelector(state => ({
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
        isLoading: state.wallet.coinmarket.isLoading,
    }));

    const { defaultValues, defaultDocumentType, documentTypes, isSelfieRequired } =
        useSavingsKYCStartDefaultValues(selectedProvider);

    const methods = useForm<SavingsKYCStartFormState>({
        mode: 'onChange',
        defaultValues,
    });
    const { register, setValue } = methods;

    const onSubmit = async () => {
        const { documentType, documentImageFront, documentImageBack, documentImageSelfie } =
            methods.getValues();

        const selectedDocumentType = documentTypes?.find(
            item => item.documentType === documentType.value,
        );

        if (selectedProvider && selectedDocumentType) {
            const documentImages = [{ documentSide: 'Front', data: documentImageFront }];
            if (
                selectedDocumentType.documentImageSides.some(item => item === 'Back') &&
                documentImageBack
            ) {
                documentImages.push({ documentSide: 'Back', data: documentImageBack });
            }
            const userKYCStart = [
                {
                    documentType: documentType.value,
                    documentImages,
                } as SavingsTradeUserKYCStart,
            ];
            if (isSelfieRequired && documentImageSelfie) {
                userKYCStart.push({
                    documentType: 'Selfie',
                    documentImages: [{ documentSide: 'Selfie', data: documentImageSelfie }],
                });
            }
            const trade = {
                exchange: selectedProvider.name,
                cryptoCurrency: selectedAccount.account.symbol,
                fiatCurrency: 'EUR',
                status: 'KYC',
                kycStatus: 'Open',
                userKYCStart,
            } as SavingsTrade;
            const response = await invityAPI.doSavingsTrade({ trade });
            if (response) {
                saveSavingsTradeResponse(response);
                startWatchingKYCStatus(trade.exchange);
                navigateToInvityAML();
            }
        }
    };

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    const onDrop = useCallback(
        (acceptedFiles: File[], _: FileRejection[], event: DropEvent) => {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            const input = event.target as HTMLInputElement;
            reader.onload = event => {
                if (typeof event.target?.result === 'string') {
                    const base64 = event.target.result.replace(/data:.+\/.+;base64,/g, '');
                    setValue(input.name as keyof SavingsKYCStartFormState, base64);
                }
            };
            reader.readAsDataURL(file);
        },
        [setValue],
    );

    const dropzoneOptions = {
        onDrop,
        multiple: false,
        noClick: true,
        accept: 'image/jpeg, image/png',
        maxSize: 2 ** 20 * 5, // 5MB
    } as DropzoneOptions;

    const frontDropzoneState = useDropzone(dropzoneOptions);
    const backDropzoneState = useDropzone(dropzoneOptions);
    const selfieDropzoneState = useDropzone(dropzoneOptions);
    return {
        ...methods,
        register: typedRegister,
        onSubmit,
        isLoading,
        frontDropzoneState,
        backDropzoneState,
        selfieDropzoneState,
        defaultDocumentType,
        isSelfieRequired,
        documentTypes,
        provider: selectedProvider,
    };
};
