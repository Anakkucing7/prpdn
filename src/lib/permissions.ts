export const permissionModules = ['dashboard','comparison','regions','idsd','kfd','poverty','eppd','rpjmd','indicators','years','import','validation','users','roles','activity','settings'] as const;
export type PermissionModule = typeof permissionModules[number];
export type Permission = 'view' | 'manage' | 'approve';
export type Permissions = Partial<Record<PermissionModule, Permission[]>>;
export const roleNames = { 'public-viewer':'Public Viewer', 'internal-viewer':'Internal Viewer', operator:'Operator', validator:'Validator', administrator:'Administrator', 'super-admin':'Super Admin' } as const;
export type RoleId = keyof typeof roleNames;
export function initialPermissions(role:RoleId):Permissions {
  if(role==='public-viewer') return {};
  const result:Permissions={};
  for(const key of permissionModules) {
    if(['dashboard','comparison','regions','idsd','kfd','poverty','eppd','rpjmd'].includes(key)) result[key]=['view'];
    if(['operator','validator','administrator','super-admin'].includes(role)&&['idsd','kfd','poverty','eppd','rpjmd','import'].includes(key)) result[key]=['view','manage'];
    if(['validator','administrator','super-admin'].includes(role)&&key==='validation') result[key]=['view','manage','approve'];
    if(['administrator','super-admin'].includes(role)&&['regions','indicators','years','users','settings'].includes(key)) result[key]=['view','manage'];
    if(['operator','validator','administrator','super-admin'].includes(role)&&key==='activity') result[key]=['view'];
    if(role==='super-admin'&&key==='roles') result[key]=['view','manage'];
  }
  return result;
}
export function permitted(permissions:Permissions, module:PermissionModule, action:Permission='view') { return permissions[module]?.includes(action)??false; }
