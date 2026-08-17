import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('dashboard architecture', () => {
  it('keeps the final top-level feature labels on the dashboard and drawer', () => {
    const homeSource = read('src/screens/private-home/PrivateHomeScreen.tsx');
    const drawerSource = read('src/navigation/usePrimaryDrawer.ts');

    expect(homeSource).toContain('title="Hide Apps"');
    expect(homeSource).toContain('title="Smart Hide"');
    expect(homeSource).toContain('title="App Lock"');
    expect(homeSource).toContain('title="Hide + Lock"');

    expect(drawerSource).toContain("label: 'Hide Apps'");
    expect(drawerSource).toContain("label: 'Smart Hide'");
    expect(drawerSource).toContain("label: 'App Lock'");
    expect(drawerSource).toContain("label: 'Hide + Lock'");
  });

  it('returns to the Protection Dashboard after secret trigger setup', () => {
    const secretEntrySource = read('src/screens/secret-entry/SecretEntryScreen.tsx');
    const appSource = read('src/App.tsx');

    expect(secretEntrySource).toContain("routes: [{name: 'PrivateHome'}]");
    expect(appSource).toContain("setInitialRouteName('PrivateHome')");
  });
});
