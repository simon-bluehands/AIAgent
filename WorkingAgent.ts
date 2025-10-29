import { google } from "@ai-sdk/google";
import { type ModelMessage, streamText, tool } from "ai";
import z from "zod";
import 'dotenv/config';
import * as readline from 'readline/promises';



const categories = ["Siemens", "Scriptrunner", "Bluehands trifft sich", "Urlaub", "Weiteres"];

let step = 0;
let exit = false;

const messageHistory: ModelMessage[] = [
    {
        role: "system",
        content: `Du bist ein Kalenderassistent. 
        Du hilfst dem Benutzer, Kalendereinträge zu erstellen. 
        Versuche den Titel aus der Benutzereingabe zu extrahieren.
        Benutze nur Kategorien aus der Liste.
        Exite das Gespräch, wenn der Benutzer "Exit" sagt oder einen Kalendereintrag erstellt wurde.
        Du kannst die folgenden Tools verwenden: 
        Kategorien abrufen und Kalendereintrag schreiben
        Exit 
        `
    },
    { 
        role: "user", 
        content: `Ich möchte einen Kalendereintrag erstellen. Ich war in einem Meeting mit Bluehands trifft sich.` 
    }
];

while (step < 10 && !exit) {
   const result = streamText(
    {
      model: google('gemini-2.0-flash-lite'),
      messages: messageHistory,
      tools: {
        getCategories: tool({
            description: "Get calendar categories from an API",
            inputSchema: z.object({}),
            outputSchema: z.string(),
            execute: async () => {
                return new Promise<string>((resolve) => {
                    setTimeout(() => {
                        console.log("Fetched categories from API");
                        resolve(categories.join(", "));
                    }, 1000);
                });
            }
        }),
        writeCalenderEvent: tool({
            description: "Write a calendar event",
            inputSchema: z.object({
                title: z.string().describe("Title of the event"),
                date: z.string().describe("Date of the event in YYYY-MM-DD format"),
                category: z.enum(categories).describe("Category of the event"),
            }),
            outputSchema: z.string(),
            execute: async (input) => {
                return new Promise<string>((resolve) => {
                    setTimeout(() => {
                        console.log("Wrote calendar event to API" + JSON.stringify(input));
                        resolve(`Event "${input.title}" on ${input.date} under category "${input.category}" created successfully.`);
                    }, 1000);
                });
            }
        }),
        exit: tool({
            description: "Exit the conversation",
            inputSchema: z.object({}),
            outputSchema: z.string(),
            execute: async () => {
                return new Promise<string>((resolve) => {
                    setTimeout(() => {
                        console.log("Exited conversation");
                        exit = true;
                        resolve("Goodbye!");
                    }, 1000);
                });
            }
        })
        }, 
    });

    if(exit) {
        break;
    }

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }
    console.log();

    const response = await result.response;
    messageHistory.push(...response.messages);

    const finishReason = await result.finishReason;


    if (finishReason === "stop") {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question('Your input: ');
        rl.close();
        messageHistory.push({ role: "user", content: answer });
    }

    step++;
}

