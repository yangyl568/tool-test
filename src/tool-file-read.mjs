import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { tool } from "@langchain/core/tools";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import fs from "node:fs/promises";
import { z } from "zod";

const model = new ChatDeepSeek({
  modelName: process.env.DEEPSEEK_MODEL,
  apiKey: process.env.DEEPSEEK_API_KEY,
  temperature: 0, // temperature 是温度，也就是 ai 的创造性，设置为 0，让它严格按照指令来做事情，不要自己发挥
});

const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(
      `  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`,
    );

    return `文件内容：\n ${content}`;
  },
  {
    name: "read_file",
    description:
      "用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

const tools = [readFileTool];

const modelWithTools = model.bindTools(tools);
const messages = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。

工作流程：
1. 用户要求读取文件时，立即调用 read_file 工具
2. 等待工具返回文件内容
3. 基于文件内容进行分析和解释

可用工具：
- read_file: 读取文件内容（使用此工具来获取文件内容）
`),
  new HumanMessage("请读取 src/tool-file-read.mjs 文件内容并解释代码"),
];
let response = await modelWithTools.invoke(messages);
messages.push(response);

while (response.tool_calls && response.tool_calls.length > 0) {
  console.log(`有${response.tool_calls.length}个工具调用，继续处理`);

  const toolResults = await Promise.all(
    response.tool_calls.map(async (toolCall) => {
      const tool = tools.find((t) => t.name === toolCall.name);
      if (!tool) {
        console.log(`未找到工具: ${toolCall.name}`);
        return null;
      }
      console.log(`  [执行工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`);

      try {
        const result = await tool.invoke(toolCall.args);
        return result;
      } catch (error) {
        console.error(`工具调用失败: ${toolCall.name}`, error);
        return null;
      }
    }),
  );
//   console.log(toolResults);
// 将工具结果添加到消息历史
  response.tool_calls.forEach((toolCall, index) => {
    messages.push(
      new ToolMessage({
        content: toolResults[index],
        tool_call_id: toolCall.id,
      }),
    );
  });

  response = await modelWithTools.invoke(messages);
}

console.log('\n[最终回复]');
console.log(response.content);

