import { ChatDeepSeek } from '@langchain/deepseek';
import dotenv from 'dotenv';

dotenv.config();

const model = new ChatDeepSeek({
  modelName: process.env.DEEPSEEK_MODEL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const response = await model.invoke("介绍下自己");
console.log(response.content);