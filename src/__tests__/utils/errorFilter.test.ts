import { describe, expect, it } from 'vitest';
import { handleError } from '../../utils/errorFilter';

describe('handleError', () => {
  it('classifies user-related messages as user errors', () => {
    expect(handleError(new Error('Email already exists'))).toEqual({
      type: 'user',
      message: 'Email already exists',
    });
    expect(handleError(new Error('Numéro de téléphone invalid'))).toEqual({
      type: 'user',
      message: 'Numéro de téléphone invalid',
    });
  });

  it('falls back to system errors when no user keyword is present', () => {
    const error = new Error('Database timeout');
    expect(handleError(error)).toEqual({
      type: 'system',
      error,
    });
  });
});
