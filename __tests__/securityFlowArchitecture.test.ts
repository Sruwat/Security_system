import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('security flow architecture', () => {
  it('uses native credential APIs for onboarding, auth, and secret entry', () => {
    expect(read('src/screens/onboarding/WelcomeScreen.tsx')).toContain('createCredential(APP_UNLOCK_CREDENTIAL_TYPE');
    expect(read('src/screens/onboarding/WelcomeScreen.tsx')).toContain('createCredential(VAULT_SECRET_CREDENTIAL_TYPE');
    expect(read('src/screens/auth/AuthGateScreen.tsx')).toContain('verifyCredential(APP_UNLOCK_CREDENTIAL_TYPE');
    expect(read('src/screens/secret-entry/SecretEntryScreen.tsx')).toContain('verifyCredential(VAULT_SECRET_CREDENTIAL_TYPE');
  });

  it('enables device credential fallback in the native biometric prompt', () => {
    const biometricSource = read('android/app/src/main/java/com/smartapplockhide/biometric/BiometricAuthenticator.kt');
    expect(biometricSource).toContain('DEVICE_CREDENTIAL');
    expect(biometricSource).toContain('setAllowedAuthenticators');
  });
});
