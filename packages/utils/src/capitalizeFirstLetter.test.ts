import { capitalizeFirstLetter } from './capitalizeFirstLetter';

it('capitalizeFirstLetter', () => {
    expect(capitalizeFirstLetter('god')).toBe('God');
    expect(capitalizeFirstLetter('dog')).toBe('Dog');
});
