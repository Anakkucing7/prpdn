import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { demoUsers, demoActivities, roles, permissionRows } from '../src/data/system-demo.ts';

// Resolve the one application import without changing the app's TS configuration.
const source = readFileSync(new URL('../src/lib/system-validation.ts', import.meta.url), 'utf8').replace("'../data/system-demo'", JSON.stringify(new URL('../src/data/system-demo.ts', import.meta.url).href));
const { validateUser, validateSettings } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
const draft = {name:'Pengguna Uji',username:'pengguna.uji',email:'uji@example.com',workUnit:'',role:'Operator'};
assert.deepEqual(validateUser(draft,demoUsers),{});
assert.ok(validateUser({...draft,name:' ',username:'a',email:'invalid'},demoUsers).name);
assert.ok(validateUser({...draft,username:' ADMIN.DEMO ',email:'ADMIN@EXAMPLE.COM'},demoUsers).username);
assert.ok(validateUser({...draft,email:'ADMIN@EXAMPLE.COM'},demoUsers).email);
assert.deepEqual(validateUser(demoUsers[0],demoUsers.slice(1)),{});
assert.ok(validateUser({...draft,role:'Unknown'},demoUsers).role);
const settings={name:'PRPDN',description:'Deskripsi',year:'2024',province:'all',pageSize:'15'};
assert.deepEqual(validateSettings(settings),{});
assert.ok(validateSettings({...settings,name:' ',description:'x'.repeat(201),year:'1900',pageSize:'0'}).name);
assert.ok(validateSettings({...settings,year:'1900'}).year);
assert.ok(validateSettings({...settings,pageSize:'0'}).pageSize);
assert.equal(new Set(demoUsers.map(r=>r.id)).size,demoUsers.length);
assert.ok(permissionRows.every(row=>row.levels.length===roles.length));
assert.ok(demoActivities.every(log=>demoUsers.some(user=>user.id===log.actor)&&Number.isFinite(Date.parse(log.timestamp))));
console.log('System demo: validation, duplicate checks, role matrix, and log references passed.');
