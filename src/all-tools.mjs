/**
 * 放所有的 tools
 */
import { tool } from "@langchain/core/tools";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";

//1 读取文件工具
const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      console.log(
        `[工具调用] read_file("${filePath}")- 成功读取 ${content.length} 字节`,
      );
      return `文件内容:\n${content}`;
    } catch (error) {
      console.log(
        `[工具调用] read_file("${filePath}")- 失败: ${error.message}，`,
      );
      return `读取文件失败: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "读取指定文件的内容",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

// 2. 写入文件工具
const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      console.log(
        `[工具调用] write_file("${filePath}")- 成功写入 ${content.length} 字节`,
      );
      return `文件已成功写入: ${filePath}`;
    } catch (error) {
      console.log(
        `[工具调用] write_file("${filePath}")- 失败: ${error.message}，`,
      );
      return `写入文件失败: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: "写入指定文件的内容，创建必要的目录",
    schema: z.object({
      filePath: z.string().describe("要写入的文件路径"),
      content: z.string().describe("要写入的文件内容"),
    }),
  },
);

// 3. 执行命令工具(带实时输出)
const executeCommandTool = tool(
  async ({ command, workingDirectory }) => {
    const cwd = workingDirectory || process.cwd();
    console.log(
      `[工具调用] execute_command("${command}")${workingDirectory ? ` - ${workingDirectory}` : ""}- 成功执行`,
    );

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });

      let errorMsg = "";

      child.on("error", (err) => {
        errorMsg = err.message;
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log(`  [工具调用] execute_command("${command}") - 执行成功`);
          const cwdInfo = workingDirectory
            ? `\n\n重要提示：命令在目录 "${workingDirectory}" 中执行成功。如果需要在这个项目目录中继续执行命令，请使用 workingDirectory: "${workingDirectory}" 参数，不要使用 cd 命令。`
            : "";
          resolve(`命令执行成功: ${command}${cwdInfo}`);
        } else {
          console.log(
            `  [工具调用] execute_command("${command}") - 执行失败，退出码: ${code}`,
          );
          resolve(
            `命令执行失败，退出码: ${code}${errorMsg ? "\n错误: " + errorMsg : ""}`,
          );
        }
      });
    });
  },
  {
    name: "execute_command",
    description: "执行系统命令，支持指定工作目录，实时显示输出",
    schema: z.object({
      command: z.string().describe("要执行的系统命令"),
      workingDirectory: z.string().describe("命令的工作目录"),
    }),
  },
);

// 4. 列出目录工具
const listDirectoryTool = tool(
  async ({ directory }) => {
    try {
      const files = await fs.readdir(directory);
      console.log(
        `[工具调用] list_directory("${directory}")- 成功列出 ${files.length} 个文件`,
      );
      return `目录 "${directory}" 包含以下文件:\n${files.join("\n")}`;
    } catch (error) {
      console.log(
        `[工具调用] list_directory("${directory}")- 失败: ${error.message}，`,
      );
      return `列出目录失败: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "列出指定目录下的所有文件",
    schema: z.object({
      directory: z.string().describe("要列出的目录路径"),
    }),
  },
);

export { readFileTool, writeFileTool, executeCommandTool, listDirectoryTool };