import { useHotkeys } from 'react-hotkeys-hook';
import { useActions } from '@suite-hooks';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { setEgg } from '@suite-actions/suiteActions';
import { addToast } from '@suite-actions/notificationActions';

let index = 0;
// Konami code
const sequence = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
    'Enter',
];

const Egg = () => {
    const { egg, toast } = useActions({
        egg: setEgg,
        toast: addToast,
    });

    useHotkeys('*', e => {
        if (e.key === sequence[index]) {
            index++;

            // Unlock!
            if (index === 10) {
                // Reset
                index = 0;
                // Play audio
                new Audio(resolveStaticPath('/media/carlos.wav')).play();
                // Unlock content
                egg(true);
                // Show notification
                toast({ type: 'egg' });
            }
        } else {
            index = 0;
        }
    });

    return null;
};

export default Egg;
