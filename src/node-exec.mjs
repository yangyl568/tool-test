import { spawn } from "node:child_process";

/** 要执行的系统命令字符串 */
const command = 'echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts';
/** 命令的工作目录（当前进程的工作目录） */
const cwd = process.cwd();

// 解析命令和参数
/** 将命令字符串按空格拆分为 [命令, 参数1, 参数2, ...] */
const [cmd, ...args] = command.split(" ");

/** 子进程：{cwd} 为工作目录，stdio:"inherit" 使子进程直接复用父进程的终端输出，shell:true 启用 shell 解释器 */
const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });

let errorMsg = "";

/** 捕获子进程启动失败的错误（如命令不存在、权限不足等） */
child.on("error", (err) => {
  errorMsg = err.message;
});

/** 子进程退出时的回调 */
child.on("close", (code) => {
  if (code === 0) {
    // 正常退出：直接结束父进程
    process.exit(0);
  } else {
    // 非正常退出：打印错误信息后以对应退出码结束
    if (errorMsg) {
      console.error(`执行命令失败: ${errorMsg}`);
    }
    process.exit(code || 1);
  }
});
