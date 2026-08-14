import fs from 'node:fs';
import path from 'node:path';

describe('manage apps architecture', () => {
  it('does not launch apps directly from ManageAppsScreen', () => {
    const file = path.join(process.cwd(), 'src', 'screens', 'manage-apps', 'ManageAppsScreen.tsx');
    const contents = fs.readFileSync(file, 'utf8');

    expect(contents).not.toMatch(/launchCoordinator\.launch\s*\(/);
    expect(contents).not.toMatch(/nativeBridge\.launchApp\s*\(/);
  });
});
