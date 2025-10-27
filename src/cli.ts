#!/usr/bin/env node
import 'dotenv/config';
import { startAutoServer } from './index.server.js';
import './logger.js'; // 导入日志配置

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else if (token === '-h') {
      args['help'] = true;
    }
  }
  return args;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args['help']) {
    console.log(`\nUsage: npx midscene-pc [--port <port>] [--host <host>]\n\nOptions:\n  --port    覆盖环境变量 PORT，默认 3333\n  --host    覆盖环境变量 HOST，默认 0.0.0.0\n  -h, --help  显示帮助\n`);
    process.exit(0);
  }

  const portFromArg = typeof args['port'] === 'string' ? Number(args['port']) : undefined;
  const hostFromArg = typeof args['host'] === 'string' ? String(args['host']) : undefined;

  const port = portFromArg ?? (process.env.PORT ? Number(process.env.PORT) : 3333);
  const host = hostFromArg ?? (process.env.HOST ?? '0.0.0.0');

  try {
    await startAutoServer(port, host);
    console.log(`[midscene-pc] 服务已启动: http://${host}:${port}`);
  } catch (err) {
    console.error('[midscene-pc] 启动失败:', err);
    process.exit(1);
  }
}

main();