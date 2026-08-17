import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('AuthGateScreen auth layout', () => {
  it('keeps the full PIN fallback path in the screen source', () => {
    const source = read('src/screens/auth/AuthGateScreen.tsx');

    expect(source).toContain("['Clear', '0', 'Continue']");
    expect(source).toContain("loading && value === 'Continue' ? 'Checking...' : value");
    expect(source).toContain("'Use biometrics'");
    expect(source).toContain("pin.length < 4");
    expect(source).toContain('getPendingAuthRequest()');
    expect(source).toContain('launchCoordinator.restorePendingLaunch');
  });
});
