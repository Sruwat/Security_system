import {ProtectionManager} from '../src/services/protection/ProtectionManager';

const protectionManager = new ProtectionManager();

describe('ProtectionManager', () => {
  it('allows NONE without authentication', () => {
    expect(protectionManager.evaluateDecision('NONE', 'pkg')).toMatchObject({
      launchable: true,
      requiresAuthentication: false,
      requiresSecretEntry: false,
    });
  });

  it('requires authentication for LOCK when no session exists', () => {
    expect(protectionManager.evaluateDecision('LOCK', 'pkg')).toMatchObject({
      launchable: true,
      requiresAuthentication: true,
      requiresSecretEntry: false,
    });
  });

  it('requires secret entry for hidden modes', () => {
    expect(protectionManager.evaluateDecision('HIDE', 'pkg')).toMatchObject({
      launchable: false,
      requiresSecretEntry: true,
    });
    expect(protectionManager.evaluateDecision('LOCK_HIDE', 'pkg')).toMatchObject({
      launchable: false,
      requiresSecretEntry: true,
      requiresAuthentication: true,
    });
  });
});
