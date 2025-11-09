import { FileSystem } from './fileSystem';
import { getTranslation } from './translations';

interface CommandContext {
  setCurrentPath: (path: string) => void;
  openEditor: (filename: string, content: string) => void;
  clearOutput: () => void;
  isEnglish: boolean;
}

export function executeCommand(
  commandLine: string,
  currentPath: string,
  fileSystem: FileSystem,
  context: CommandContext
): string {
  const [command, ...args] = commandLine.trim().split(' ');
  const argString = args.join(' ');
  const t = (key: string) => getTranslation(key, context.isEnglish);

  const commands: Record<string, (args: string) => string> = {
    help: () => `<div class="text-gray-300">${t('helpTitle')}

    <span class="text-yellow-400">${t('filesNav')}</span>
    <span class="text-blue-400">ls</span> [path]       ${t('lsDesc')}
    <span class="text-blue-400">cd</span> [path]       ${t('cdDesc')}
    <span class="text-blue-400">pwd</span>             ${t('pwdDesc')}
    <span class="text-blue-400">mkdir</span> [name]    ${t('mkdirDesc')}
    <span class="text-blue-400">touch</span> [name]    ${t('touchDesc')}
    <span class="text-blue-400">rm</span> [name]       ${t('rmDesc')}
    <span class="text-blue-400">cat</span> [file]      ${t('catDesc')}

    <span class="text-yellow-400">${t('textEditor')}</span>
    <span class="text-blue-400">nano</span> [file]     ${t('nanoDesc')}

    <span class="text-yellow-400">AI:</span>
    <span class="text-blue-400">ask</span> [question]  - Ask AI (Gemini)
    <span class="text-blue-400">task</span> [instruction] - Execute task sequence with AI

    <span class="text-yellow-400">${t('system')}</span>
    <span class="text-blue-400">clear</span>           ${t('clearDesc')}
    <span class="text-blue-400">whoami</span>          ${t('whoamiDesc')}
    <span class="text-blue-400">date</span>            ${t('dateDesc')}
    <span class="text-blue-400">echo</span> [text]     ${t('echoDesc')}
    <span class="text-blue-400">tree</span>            ${t('treeDesc')}

    <span class="text-yellow-400">${t('funCommands')}</span>
    <span class="text-blue-400">neofetch</span>        ${t('neofetchDesc')}
    <span class="text-blue-400">cowsay</span> [text]   ${t('cowsayDesc')}
    <span class="text-blue-400">sl</span>              ${t('slDesc')}
    <span class="text-blue-400">matrix</span>          ${t('matrixDesc')}
    <span class="text-blue-400">fortune</span>         ${t('fortuneDesc')}
    <span class="text-blue-400">figlet</span> [text]   ${t('figletDesc')}
    <span class="text-blue-400">joke</span>            ${t('jokeDesc')}
    <span class="text-blue-400">weather</span>         ${t('weatherDesc')}</div>`,

    ls: (args = '') => {
      const targetPath = fileSystem.resolveRelativePath(args.trim() || currentPath, currentPath);
      const dir = fileSystem.getDirectoryAtPath(targetPath);

      if (!dir) return `<span class="text-red-400">ls: ${targetPath}: ${t('fileNotFound')}</span>`;
      if (dir.type !== 'directory') return `<span class="text-red-400">ls: ${targetPath}: ${t('notDirectory')}</span>`;

      const items = Object.entries(dir.children).map(([name, item]) => {
        if (item.type === 'directory') {
          return `<span class="text-blue-400">${name}/</span>`;
        } else {
          return `<span class="text-green-400">${name}</span>`;
        }
      });

      return items.length > 0 ? items.join('  ') : '';
    },

    cd: (args) => {
      if (!args.trim()) {
        context.setCurrentPath('/home/user');
        return '';
      }

      const targetPath = fileSystem.resolveRelativePath(args.trim(), currentPath);
      const dir = fileSystem.getDirectoryAtPath(targetPath);

      if (!dir) return `<span class="text-red-400">cd: ${targetPath}: ${t('fileNotFound')}</span>`;
      if (dir.type !== 'directory') return `<span class="text-red-400">cd: ${targetPath}: ${t('notDirectory')}</span>`;

      context.setCurrentPath(targetPath);
      return '';
    },

    pwd: () => currentPath,

    mkdir: (args) => {
      if (!args.trim()) return `<span class="text-red-400">mkdir: ${t('missingOperand')}</span>`;

      const name = args.trim();
      if (name.includes('/')) return `<span class="text-red-400">mkdir: invalid directory name</span>`;

      const currentDir = fileSystem.getDirectoryAtPath(currentPath);
      if (!currentDir) return `<span class="text-red-400">mkdir: error</span>`;
      if (currentDir.children[name]) return `<span class="text-red-400">mkdir: '${name}': ${t('fileExists')}</span>`;

      currentDir.children[name] = { type: 'directory', children: {} };
      return '';
    },

    touch: (args) => {
      if (!args.trim()) return `<span class="text-red-400">touch: ${t('missingOperand')}</span>`;

      const name = args.trim();
      if (name.includes('/')) return `<span class="text-red-400">touch: invalid filename</span>`;

      const currentDir = fileSystem.getDirectoryAtPath(currentPath);
      if (!currentDir) return `<span class="text-red-400">touch: error</span>`;
      if (!currentDir.children[name]) {
        currentDir.children[name] = { type: 'file', content: '', children: {} };
      }
      return '';
    },

    rm: (args) => {
      if (!args.trim()) return `<span class="text-red-400">rm: ${t('missingOperand')}</span>`;

      const name = args.trim();
      if (name.includes('/')) return `<span class="text-red-400">rm: invalid name</span>`;

      const currentDir = fileSystem.getDirectoryAtPath(currentPath);
      if (!currentDir) return `<span class="text-red-400">rm: error</span>`;
      if (!currentDir.children[name]) return `<span class="text-red-400">rm: '${name}': ${t('fileNotFound')}</span>`;

      delete currentDir.children[name];
      return '';
    },

    cat: (args) => {
      if (!args.trim()) return `<span class="text-red-400">cat: ${t('missingOperand')}</span>`;

      const targetPath = fileSystem.resolveRelativePath(args.trim(), currentPath);
      const file = fileSystem.getDirectoryAtPath(targetPath);

      if (!file) return `<span class="text-red-400">cat: ${targetPath}: ${t('fileNotFound')}</span>`;
      if (file.type !== 'file') return `<span class="text-red-400">cat: ${targetPath}: ${t('isDirectory')}</span>`;

      return file.content || '';
    },

    nano: (args) => {
      if (!args.trim()) return `<span class="text-red-400">nano: filename missing</span>`;

      const filename = args.trim();
      if (filename.includes('/')) return `<span class="text-red-400">nano: invalid filename</span>`;

      const currentDir = fileSystem.getDirectoryAtPath(currentPath);
      if (!currentDir) return `<span class="text-red-400">nano: error</span>`;

      if (!currentDir.children[filename]) {
        currentDir.children[filename] = { type: 'file', content: '', children: {} };
      }

      if (currentDir.children[filename].type !== 'file') {
        return `<span class="text-red-400">nano: ${filename}: ${t('isDirectory')}</span>`;
      }

      context.openEditor(filename, currentDir.children[filename].content || '');
      return '';
    },

    clear: () => {
      context.clearOutput();
      return '';
    },

    whoami: () => 'user',

    date: () => new Date().toLocaleString(context.isEnglish ? 'en-US' : 'fr-FR'),

    echo: (args) => args || '',

    tree: () => {
      const dir = fileSystem.getDirectoryAtPath(currentPath);
      if (!dir) return `<span class="text-red-400">tree: error</span>`;
      return generateTree(dir);
    },

    neofetch: () => `<div class="text-blue-400">
    ╭─────────────────────────╮
    │  <span class="text-green-400">Terminux 1.0</span>           │
    │  <span class="text-blue-400">────────────────────</span>   │
    │  <span class="text-yellow-400">OS:</span> Ubuntu (Web)       │
    │  <span class="text-yellow-400">Shell:</span> terminux        │
    │  <span class="text-yellow-400">Resolution:</span> ${window.innerWidth}x${window.innerHeight}   │
    │  <span class="text-yellow-400">Language:</span> ${context.isEnglish ? 'English' : 'Français'}     │
    ╰─────────────────────────╯</div>`,

    cowsay: (args) => {
      const message = args || (context.isEnglish ? 'Moo!' : 'Meuh!');
      const topLine = '─'.repeat(message.length + 2);
      return `<div class="text-gray-300">
     <span class="text-yellow-400">╭─${topLine}─╮</span>
     <span class="text-yellow-400">│</span>  ${message}  <span class="text-yellow-400">│</span>
     <span class="text-yellow-400">╰─${topLine}─╯</span>
        <span class="text-green-400">\\   ^__^</span>
         <span class="text-green-400">\\  (oo)\\_______</span>
            <span class="text-green-400">(__) \\       )\\/\\</span>
                <span class="text-green-400">||----w |</span>
                <span class="text-green-400">||     ||</span></div>`;
    },

    sl: () => `<div class="text-yellow-400">
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/
</div>
<span class="text-blue-400">${context.isEnglish ? 'Steam Locomotive!' : 'Locomotive à Vapeur!'}</span>`,

    matrix: () => {
      const chars = ['0', '1', ' ', ' ', ' '];
      let output = '<div class="text-green-400">';
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 60; j++) {
          output += chars[Math.floor(Math.random() * chars.length)];
        }
        output += '\n';
      }
      output += '</div>';
      return output + `\n<span class="text-blue-400">${context.isEnglish ? 'Welcome to the Matrix...' : 'Bienvenue dans la Matrice...'}</span>`;
    },

    fortune: () => {
      const fortunes = context.isEnglish ? [
        "Today is a good day to code!",
        "The best way to predict the future is to implement it.",
        "Code is poetry written for machines to understand.",
        "Every expert was once a beginner. Keep coding!",
        "Talk is cheap. Show me the code. - Linus Torvalds"
      ] : [
        "Aujourd'hui est un bon jour pour coder!",
        "La meilleure façon de prédire l'avenir est de l'implémenter.",
        "Le code est de la poésie écrite pour que les machines comprennent.",
        "Chaque expert était autrefois débutant. Continuez à coder!",
        "Les paroles sont gratuites. Montrez-moi le code. - Linus Torvalds"
      ];
      return `<span class="text-yellow-400">${fortunes[Math.floor(Math.random() * fortunes.length)]}</span>`;
    },

    figlet: (args) => {
      const text = (args || 'TERMINUX').toUpperCase().slice(0, 8);
      return `<div class="text-green-400">
████████ ████████ ██████   ███    ███ ██ ███    ██ ██    ██ ██   ██
   ██    ██       ██   ██  ████  ████ ██ ████   ██ ██    ██  ██ ██
   ██    █████    ██████   ██ ████ ██ ██ ██ ██  ██ ██    ██   ███
   ██    ██       ██   ██  ██  ██  ██ ██ ██  ██ ██ ██    ██  ██ ██
   ██    ████████ ██   ██  ██      ██ ██ ██   ████  ██████  ██   ██
</div>`;
    },

    joke: () => {
      const jokes = context.isEnglish ? [
        "Why do programmers prefer dark mode?\nBecause light attracts bugs!",
        "How many programmers does it take to change a light bulb?\nNone. That's a hardware problem.",
        "Why do Java developers wear glasses?\nBecause they can't C#",
        "What's the object-oriented way to become wealthy?\nInheritance!"
      ] : [
        "Pourquoi les programmeurs préfèrent le mode sombre?\nParce que la lumière attire les bugs!",
        "Combien faut-il de programmeurs pour changer une ampoule?\nAucun. C'est un problème hardware.",
        "Pourquoi les développeurs Java portent des lunettes?\nParce qu'ils ne peuvent pas C#",
        "Quelle est la façon orientée objet de devenir riche?\nL'héritage!"
      ];
      return `<span class="text-yellow-400">${jokes[Math.floor(Math.random() * jokes.length)]}</span>`;
    },

    weather: () => {
      const weathers = [
        { icon: '☀️', desc: context.isEnglish ? 'Sunny' : 'Ensoleillé' },
        { icon: '⛅', desc: context.isEnglish ? 'Partly Cloudy' : 'Partiellement nuageux' },
        { icon: '🌧️', desc: context.isEnglish ? 'Rainy' : 'Pluvieux' }
      ];
      const weather = weathers[Math.floor(Math.random() * weathers.length)];
      const temp = Math.floor(Math.random() * 30) + 5;

      return `<div class="text-blue-400">
${weather.icon} ${weather.desc}
🌡️  ${temp}°C
📍 Terminux City
</div>`;
    }
  };

  if (commands[command]) {
    return commands[command](argString);
  } else {
    return `<span class="text-red-400">bash: ${command}: ${t('commandNotFound')}</span>`;
  }
}

function generateTree(dir: any, prefix = '', isLast = true): string {
  let result = '';
  const entries = Object.entries(dir.children);

  entries.forEach(([name, item]: [string, any], index) => {
    const isLastItem = index === entries.length - 1;
    const connector = isLastItem ? '└── ' : '├── ';
    const icon = item.type === 'directory' ? '📁' : '📄';

    result += prefix + connector + icon + ' ' + name + '\n';

    if (item.type === 'directory' && Object.keys(item.children).length > 0) {
      const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
      result += generateTree(item, newPrefix, false);
    }
  });

  return result;
}
