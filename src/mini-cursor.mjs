import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  readFileTool,
  writeFileTool,
  executeCommandTool,
  listDirectoryTool,
} from "./all-tools.mjs";
import chalk from "chalk";

const model = new ChatDeepSeek({
  modelName: process.env.DEEPSEEK_MODEL,
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0,
});

const tools = [
  readFileTool,
  writeFileTool,
  executeCommandTool,
  listDirectoryTool,
];

const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [
    new SystemMessage(`你是一个项目管理助手，使用工具完成任务。
    当前工作目录：${process.cwd()}

    工具：
    1.read_file：读取文件内容，参数为文件路径
    2.list_directory：列出指定目录下的所有文件，参数为目录路径
    3.execute_command：执行系统命令，参数为命令字符串
    4.write_file：写入文件内容，参数为文件路径和内容字符串

    重要规则 - execute_command:
    - workingDirectory 参数会自动切换到指定目录
    - 当使用 workingDirectory 时，绝对不要在 command 中使用 cd 命令
    - 错误示例：{ command: "cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
    这是错误的！因为 workingDirectory 已存在 react-todo-app 目录了， 再 cd react-todo-app 会找不到目录。
    - 正确示例：{ command: "pnpm install", workingDirectory: "react-todo-app" }
    这是正确的，会自动切换到 react-todo-app 目录并执行 pnpm install 命令。

    回复要简洁，只说做了什么。
`),
    new HumanMessage(query),
  ];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`正在等待 AI 思考...`));
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    // 检查是否有工具调用
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n AI 最终回复 ：\n ${response.content} \n`);
      return response.content;
    }

    for (const tool_call of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === tool_call.name);
      if (!foundTool) {
        console.log(`\n 工具调用失败：未找到工具 "${tool_call.name}" \n`);
        continue;
      }
      const toolResult = await foundTool.invoke(tool_call.args);
      messages.push(
        new ToolMessage({
          content: toolResult,
          tool_call_id: tool_call.id,
        }),
      );
      console.log(
        `\n 工具调用成功：${tool_call.name}(${tool_call.args})- ${toolResult} \n`,
      );
    }
  }
  return messages[messages.length - 1].content;
}

const case1 = `创建一个功能丰富的 React TodoList 应用: 
1. 创建项目：echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx, 实现完整功能的 TodoList :
- 添加、删除、编辑、标记完成
- 分类筛选（全部/进行中/已完成）
- 统计信息显示
- localStorage 数据持久化
3. 添加复杂样式：
- 渐变背景（蓝到紫）
- 卡片阴影、圆角
- 悬停效果
4. 添加动画：
- 添加/删除时的过渡动画
- 使用 CSS transition 实现平滑过渡
5. 列出目录确认

注意：使用 pnpm ，功能要完整，样式要美观，要有动画效果
之后在 react-todo-app 项目中：
1. 使用 pnpm install 安装依赖
2. 使用 pnpm run dev 启动服务器
`;

try {
  const result = await runAgentWithTools(case1);
  console.log(result);
} catch (error) {
  console.error(chalk.bgRed(`\n 运行失败：${error.message} \n`));
}