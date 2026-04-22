#!/usr/bin/env node
/**
 * ZZX SpriteFrame 启动脚本
 * 使用 Node.js 实现，避免 Windows CMD 批处理的控制流问题
 *
 * 使用方法:
 *   node start.js        (直接运行)
 *   npm start            (通过 package.json)
 */

const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 颜色代码
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function printBanner() {
  console.clear();
  console.log(`${C.cyan}============================================${C.reset}`);
  console.log(`${C.cyan}    ZZX SpriteFrame - 视频转序列帧工具    ${C.reset}`);
  console.log(`${C.cyan}============================================${C.reset}`);
  console.log('');
}

function printMenu() {
  printBanner();
  console.log(`  ${C.bright}[1]${C.reset} ${C.green}开发模式启动${C.reset}    npm run dev`);
  console.log(`  ${C.bright}[2]${C.reset} ${C.yellow}类型检查        ${C.reset} npm run typecheck`);
  console.log(`  ${C.bright}[3]${C.reset} ${C.blue}生产构建        ${C.reset} npm run build`);
  console.log(`  ${C.bright}[4]${C.reset} ${C.cyan}打包安装包(Win) ${C.reset} npm run dist:win`);
  console.log(`  ${C.bright}[5]${C.reset} ${C.gray}安装/更新依赖   ${C.reset} npm install`);
  console.log(`  ${C.bright}[0]${C.reset} 退出`);
  console.log('');
  console.log(`${C.cyan}============================================${C.reset}`);
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'cmd' : command;
    const cmdArgs = isWin ? ['/c', command, ...args] : args;

    console.log(`${C.dim}[执行] ${command} ${args.join(' ')}${C.reset}\n`);

    const child = spawn(cmd, cmdArgs, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options,
    });

    child.on('close', (code) => {
      resolve(code);
    });

    child.on('error', (err) => {
      console.error(`${C.red}[错误] 启动失败: ${err.message}${C.reset}`);
      resolve(1);
    });
  });
}

async function checkNode() {
  console.log(`${C.gray}[检查] Node.js 环境...${C.reset}`);
  try {
    const result = require('child_process').execSync('node --version', { encoding: 'utf8' });
    console.log(`${C.green}[通过] Node.js 版本: ${result.trim()}${C.reset}\n`);
    return true;
  } catch {
    console.error(`${C.red}[错误] 未检测到 Node.js，请先安装 (推荐 v18+)${C.reset}`);
    console.error(`${C.gray}       下载地址: https://nodejs.org/${C.reset}\n`);
    return false;
  }
}

async function checkDeps() {
  console.log(`${C.gray}[检查] 项目依赖...${C.reset}`);
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log(`${C.yellow}[提示] 未检测到 node_modules，将自动安装依赖...${C.reset}\n`);
    const code = await runCommand('npm', ['install', '--registry=https://registry.npmmirror.com']);
    if (code !== 0) {
      console.error(`${C.red}[失败] 依赖安装失败${C.reset}\n`);
      return false;
    }
    console.log(`${C.green}[成功] 依赖安装完成！${C.reset}\n`);
  } else {
    console.log(`${C.green}[通过] 依赖已安装${C.reset}\n`);
  }
  return true;
}

async function devMode() {
  if (!await checkNode()) { await ask('按 Enter 返回菜单...'); return; }
  if (!await checkDeps()) { await ask('按 Enter 返回菜单...'); return; }

  console.log(`${C.cyan}============================================${C.reset}`);
  console.log(`${C.cyan}     正在启动开发模式...${C.reset}`);
  console.log(`${C.gray}     按 Ctrl+C 停止服务器${C.reset}`);
  console.log(`${C.cyan}============================================${C.reset}\n`);

  const code = await runCommand('npm', ['run', 'dev']);

  console.log('');
  if (code !== 0) {
    console.log(`${C.red}[失败] 开发模式启动失败 (退出码: ${code})${C.reset}`);
  } else {
    console.log(`${C.gray}[信息] 开发服务器已停止${C.reset}`);
  }
  await ask('\n按 Enter 返回菜单...');
}

async function typeCheck() {
  if (!await checkNode()) { await ask('按 Enter 返回菜单...'); return; }

  console.log(`${C.gray}[检查] 项目依赖...${C.reset}`);
  if (!fs.existsSync('node_modules')) {
    console.log(`${C.red}[错误] 未检测到 node_modules，请先安装依赖 (选项 5)${C.reset}\n`);
    await ask('按 Enter 返回菜单...');
    return;
  }
  console.log(`${C.green}[通过] 依赖已安装${C.reset}\n`);

  console.log(`${C.cyan}============================================${C.reset}`);
  console.log(`${C.cyan}     正在运行类型检查...${C.reset}`);
  console.log(`${C.cyan}============================================${C.reset}\n`);

  const code = await runCommand('npm', ['run', 'typecheck']);

  console.log('');
  if (code !== 0) {
    console.log(`${C.red}[失败] 类型检查未通过，请修复错误后再构建。${C.reset}`);
  } else {
    console.log(`${C.green}[通过] 类型检查全部通过！${C.reset}`);
  }
  await ask('\n按 Enter 返回菜单...');
}

async function buildProd() {
  if (!await checkNode()) { await ask('按 Enter 返回菜单...'); return; }

  console.log(`${C.gray}[检查] 项目依赖...${C.reset}`);
  if (!fs.existsSync('node_modules')) {
    console.log(`${C.red}[错误] 未检测到 node_modules，请先安装依赖 (选项 5)${C.reset}\n`);
    await ask('按 Enter 返回菜单...');
    return;
  }
  console.log(`${C.green}[通过] 依赖已安装${C.reset}\n`);

  console.log(`${C.cyan}============================================${C.reset}`);
  console.log(`${C.cyan}     正在构建生产版本...${C.reset}`);
  console.log(`${C.cyan}============================================${C.reset}\n`);

  const code = await runCommand('npm', ['run', 'build']);

  console.log('');
  if (code !== 0) {
    console.log(`${C.red}[失败] 构建失败，请检查错误信息。${C.reset}`);
  } else {
    console.log(`${C.green}[成功] 构建完成！输出目录: out/${C.reset}`);
  }
  await ask('\n按 Enter 返回菜单...');
}

async function distWin() {
  if (!await checkNode()) { await ask('按 Enter 返回菜单...'); return; }

  console.log(`${C.gray}[检查] 项目依赖...${C.reset}`);
  if (!fs.existsSync('node_modules')) {
    console.log(`${C.red}[错误] 未检测到 node_modules，请先安装依赖 (选项 5)${C.reset}\n`);
    await ask('按 Enter 返回菜单...');
    return;
  }
  console.log(`${C.green}[通过] 依赖已安装${C.reset}\n`);

  console.log(`${C.cyan}============================================${C.reset}`);
  console.log(`${C.cyan}     正在打包 Windows 安装包...${C.reset}`);
  console.log(`${C.gray}     这可能需要几分钟...${C.reset}`);
  console.log(`${C.cyan}============================================${C.reset}\n`);

  const code = await runCommand('npm', ['run', 'dist:win']);

  console.log('');
  if (code !== 0) {
    console.log(`${C.red}[失败] 打包失败，请检查错误信息。${C.reset}`);
  } else {
    console.log(`${C.green}[成功] 打包完成！输出目录: dist/${C.reset}`);
  }
  await ask('\n按 Enter 返回菜单...');
}

async function installDeps() {
  if (!await checkNode()) { await ask('按 Enter 返回菜单...'); return; }

  console.log(`${C.cyan}============================================${C.reset}`);
  console.log(`${C.cyan}     正在安装依赖...${C.reset}`);
  console.log(`${C.gray}     首次安装可能需要 1-3 分钟${C.reset}`);
  console.log(`${C.cyan}============================================${C.reset}\n`);

  const code = await runCommand('npm', ['install', '--registry=https://registry.npmmirror.com']);

  console.log('');
  if (code !== 0) {
    console.log(`${C.red}[失败] 依赖安装失败，请检查网络连接。${C.reset}`);
  } else {
    console.log(`${C.green}[成功] 依赖安装完成！${C.reset}`);
  }
  await ask('\n按 Enter 返回菜单...');
}

async function main() {
  while (true) {
    printMenu();
    const choice = await ask('请选择操作 [0-5]: ');

    switch (choice) {
      case '1':
        await devMode();
        break;
      case '2':
        await typeCheck();
        break;
      case '3':
        await buildProd();
        break;
      case '4':
        await distWin();
        break;
      case '5':
        await installDeps();
        break;
      case '0':
        console.log(`\n${C.green}感谢使用 ZZX SpriteFrame！${C.reset}\n`);
        process.exit(0);
      default:
        console.log(`\n${C.yellow}无效选择，请重试...${C.reset}`);
        await new Promise(r => setTimeout(r, 1500));
    }
  }
}

main().catch((err) => {
  console.error(`${C.red}发生错误: ${err.message}${C.reset}`);
  process.exit(1);
});
