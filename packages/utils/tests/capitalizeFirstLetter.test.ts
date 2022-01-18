import { capitalizeFirstLetter } from '../src/capitalizeFirstLetter';

it('capitalizeFirstLetter', () => {
    expect(capitalizeFirstLetter('god')).toBe('God');
    expect(capitalizeFirstLetter('dog')).toBe('Dog');
});
