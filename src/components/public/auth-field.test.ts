import assert from 'node:assert/strict';
import { test } from 'node:test';
import { passwordStrength } from './auth-field';

test('password feedback handles empty, short, repeated, and common patterns', () => {
  assert.equal(passwordStrength(''), 0);
  assert.equal(passwordStrength('x'.repeat(12)), 1);
  assert.equal(passwordStrength('password123456'), 1);
  assert.equal(passwordStrength('abcDEF123!?'), 1);
});

test('password feedback is advisory and stays within the four-segment scale', () => {
  assert.equal(passwordStrength('autumn river'), 2);
  assert.equal(passwordStrength('Autumn River'), 3);
  assert.equal(passwordStrength('Autumn River 2026!'), 4);
  assert.ok(passwordStrength('abcDEF!?'.repeat(16)) <= 4);
});
