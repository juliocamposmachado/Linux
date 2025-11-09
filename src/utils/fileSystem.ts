export interface FileNode {
  type: 'file' | 'directory';
  content?: string;
  children: Record<string, FileNode>;
}

export class FileSystem {
  private root: FileNode;

  constructor() {
    this.root = {
      type: 'directory',
      children: {
        home: {
          type: 'directory',
          children: {
            user: {
              type: 'directory',
              children: {
                Documents: { type: 'directory', children: {} },
                Desktop: { type: 'directory', children: {} },
                Downloads: { type: 'directory', children: {} },
                'welcome.txt': {
                  type: 'file',
                  content: 'Welcome to your Ubuntu Terminal!\n\nAvailable commands:\n- help : Show help\n- ls : List files\n- cd : Change directory\n- nano : Open text editor\n- clear : Clear screen\n\nHappy exploring! 🐧',
                  children: {}
                },
                'readme.md': {
                  type: 'file',
                  content: '# Terminal Simulator\n\n## Features\n\n- Complete file system\n- Integrated text editor\n- Command history\n- Authentic Ubuntu interface\n\n## Shortcuts\n\n- ↑/↓ : Navigate history\n- Tab : Autocomplete\n- Ctrl+L : Clear screen\n- Ctrl+C : Cancel current command',
                  children: {}
                }
              }
            }
          }
        },
        etc: { type: 'directory', children: {} },
        usr: { type: 'directory', children: {} },
        var: { type: 'directory', children: {} }
      }
    };
  }

  getDirectoryAtPath(path: string): FileNode | null {
    if (path === '/') return this.root;

    const parts = path.split('/').filter(p => p);
    let current = this.root;

    for (const part of parts) {
      if (!current.children || !current.children[part]) return null;
      current = current.children[part];
    }

    return current;
  }

  resolveRelativePath(path: string, currentPath: string): string {
    if (path.startsWith('/')) return path;
    if (path === '..') {
      const parts = currentPath.split('/').filter(p => p);
      parts.pop();
      return '/' + parts.join('/');
    }
    if (path === '.') return currentPath;
    return currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
  }
}
