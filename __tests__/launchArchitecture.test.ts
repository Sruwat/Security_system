import fs from 'node:fs';
import path from 'node:path';

function readAllFiles(root: string): Array<{file: string; contents: string}> {
  const entries = fs.readdirSync(root, {withFileTypes: true});
  return entries.flatMap(entry => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return readAllFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      return [];
    }

    return [{file: fullPath, contents: fs.readFileSync(fullPath, 'utf8')}];
  });
}

describe('launch architecture', () => {
  it('keeps production screens from bypassing LaunchCoordinator with direct native launch calls', () => {
    const screenFiles = readAllFiles(path.join(process.cwd(), 'src', 'screens'));
    const forbiddenMatches = screenFiles.filter(({contents}) => {
      return /nativeBridge\.launchApp\s*\(/.test(contents) || /NativeModules\.[A-Za-z0-9_]+/.test(contents);
    });

    expect(forbiddenMatches).toEqual([]);
  });
});
