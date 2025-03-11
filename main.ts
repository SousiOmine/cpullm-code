import { ConsoleChat } from "./ConsoleChat.ts";

const console_chat = await ConsoleChat.create();
await console_chat.run();
