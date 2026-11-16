import { useSendFormContext } from '#src/hooks/wallet';

import { sendOptionFields } from './sendFormFields';

/** Opens or closes coin control, keeping the open panel in the saved draft. */
export const useCoinSelectionToggle = () => {
    const { setValue, toggleOption, setDraftSaveRequest } = useSendFormContext();

    return () => {
        setValue('hasCoinControlBeenOpened', true); // required for analytics
        toggleOption(sendOptionFields.coinSelection.option);

        // Triggers the effect in `useSendForm` that runs `saveSendFormDraftThunk`, so the open
        // Coin Control survives in the store; without it the panel may close on the next render.
        setDraftSaveRequest(true);
    };
};
