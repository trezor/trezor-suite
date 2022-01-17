import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DropEvent, DropzoneOptions, FileRejection, useDropzone } from 'react-dropzone';
import {
    SavingsKYCStartFormState,
    SavingsKYCStartContextValues,
} from '@wallet-types/coinmarket/savings/KYCStart';

import invityAPI, { SavingsTrade } from '@suite-services/invityAPI';
import { useActions, useSelector } from '@suite-hooks';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { SavingsSelectedAccount } from '@wallet-types/coinmarket/savings';
import { useSavingsKYCStartDefaultValues } from './useSavingsKYCStartDefaultValues';

export const useSavingsKYCStart = (
    selectedAccount: SavingsSelectedAccount,
): SavingsKYCStartContextValues => {
    const { loadInvityData } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });
    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { savingsInfo, isLoading } = useSelector(state => ({
        savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
        isLoading: state.wallet.coinmarket.isLoading,
    }));

    const {
        defaultValues,
        defaultDocumentType,
        defaultDocumentCountry,
        documentCountryOptions,
        documentTypeOptions,
        isSelfieRequired,
    } = useSavingsKYCStartDefaultValues(savingsInfo);
    const methods = useForm<SavingsKYCStartFormState>({
        mode: 'onChange',
        defaultValues,
    });
    const { register, setValue } = methods;

    const provider = savingsInfo?.savingsList?.providers[0];

    const onSubmit = async () => {
        const {
            documentCountry,
            documentType,
            documentNumber,
            documentImageFront,
            documentImageBack,
            documentImageSelfie,
        } = methods.getValues();

        if (provider) {
            const documentImages = [
                {
                    documentSide: 'Front',
                    data: documentImageFront,
                },
                {
                    documentSide: 'Back',
                    data: documentImageBack,
                },
            ];
            if (isSelfieRequired && documentImageSelfie) {
                documentImages.push({ documentSide: 'Selfie', data: documentImageSelfie });
            }
            const trade = {
                exchange: provider.name,
                cryptoCurrency: selectedAccount.account.symbol,
                fiatCurrency: 'EUR',
                status: 'KYC',
                kycStatus: 'Open',
                userKYCStart: {
                    documentCountry: documentCountry.value,
                    documentType: documentType.value,
                    documentNumber,
                    documentImages,
                },
            } as SavingsTrade;
            const response = await invityAPI.doSavingsTrade({ trade });
            console.log(response);
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
                    setValue(input.name, base64);
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
        defaultDocumentCountry,
        defaultDocumentType,
        documentTypeOptions,
        documentCountryOptions,
        isSelfieRequired,
    };
};
