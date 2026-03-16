import { useContext } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';

import { FormContext } from '../Form';

export const useFormContext = <TFieldValues extends FieldValues>() =>
    useContext(FormContext) as UseFormReturn<TFieldValues>;
