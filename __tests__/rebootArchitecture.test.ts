import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('reboot and hidden-session architecture', () => {
  it('restores vault access after successful auth when no app launch is pending', () => {
    const source = read('src/screens/auth/TransitionScreens.tsx');

    expect(source).toContain("if (activeSession?.vaultUnlocked) {");
    expect(source).toContain("routes: [{name: 'Vault'}]");
  });

  it('does not wipe valid reboot-restorable sessions on boot', () => {
    const source = read('android/app/src/main/java/com/smartapplockhide/lifecycle/BootCompletedReceiver.kt');

    expect(source).toContain('transientAccessRepository.read()');
    expect(source).toContain('nativeSessionRepository.read()');
    expect(source).not.toContain('TransientAccessRepository(appContext).clear()');
    expect(source).not.toContain('NativeSessionRepository(appContext).clear()');
  });
});
