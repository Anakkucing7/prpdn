import assert from 'node:assert/strict';
import { test } from 'node:test';
import { navigation, navigationForPermissions } from './navigation';
import { effectivePermissions, initialPermissions, permitted, type Permissions, type RoleId } from './permissions';

const slugs = (role: string, permissions: Permissions) => navigationForPermissions(role, permissions).flatMap(group => group.items.map(item => item.slug));
const readOnly = ['dashboard', 'comparison', 'regions', 'idsd', 'kfd', 'poverty', 'eppd', 'rpjmd', 'export'];

test('sidebar follows the default permissions for all six roles', () => {
  const expected: Record<RoleId, string[]> = {
    'public-viewer': [],
    'internal-viewer': readOnly,
    operator: [...readOnly, 'import'],
    validator: [...readOnly, 'import', 'validation'],
    administrator: [...readOnly, 'import', 'validation', 'indicators', 'years', 'users', 'activity', 'settings', 'news'],
    'super-admin': navigation.flatMap(group => group.items.map(item => item.slug)),
  };
  for (const role of Object.keys(expected) as RoleId[]) {
    assert.deepEqual(slugs(role, initialPermissions(role)).sort(), [...expected[role]].sort(), role);
  }
});

test('sidebar uses actual permissions, omits empty groups, and keeps server restrictions', () => {
  assert.deepEqual(slugs('administrator', { comparison: [] }), ['news']);
  assert.deepEqual(slugs('internal-viewer', { settings: ['view'] }), ['settings']);
  assert.deepEqual(slugs('operator', { activity: ['view'], roles: ['view'] }), []);
  assert.deepEqual(slugs('public-viewer', { idsd: ['view'] }), ['idsd']);
  assert.deepEqual(slugs('internal-viewer', { idsd: ['manage'] }), []);
  assert.deepEqual(navigationForPermissions(), []);
  const groups = navigationForPermissions('internal-viewer', { kfd: ['view'] });
  assert.deepEqual(groups.map(group => group.label), ['Kelola Data', 'Pengelolaan Data']);
  assert.ok(groups.every(group => group.items.length));
});

test('legacy administrator roles retain comparison view without overriding explicit denials', () => {
  const legacy: Permissions = { dashboard: ['view'], settings: ['view', 'manage'] };
  assert.ok(slugs('administrator', legacy).includes('comparison'));
  assert.equal(permitted(effectivePermissions('administrator', legacy), 'comparison'), true);
  assert.equal(permitted(effectivePermissions('administrator', legacy), 'comparison', 'manage'), false);
  assert.equal(permitted(effectivePermissions('administrator', { comparison: [] }), 'comparison'), false);
  assert.equal(permitted(effectivePermissions('public-viewer', {}), 'comparison'), false);
  assert.equal(permitted(effectivePermissions('internal-viewer', {}), 'comparison'), false);
  assert.equal(Object.hasOwn(legacy, 'comparison'), false);
});
