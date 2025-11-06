import { google } from "@ai-sdk/google";
import { type ModelMessage, streamText, tool } from "ai";
import z from "zod";
import 'dotenv/config';
import * as readline from 'readline/promises';

const SWAGGER_URL = "http://simon-pc.bluehands.de/ScriptRunner/api3/3/swagger.json";

const startActionParamter = z.object({
                    endpoint: z.string().describe("The API endpoint path (e.g., /api/resource)"),
                    body: z.record(z.string(), z.any()).describe("The request body that will be send as JSON"),
                });

type StartActionParamter = z.infer<typeof startActionParamter>;

const startAction = async (input: StartActionParamter ) => {
    try {
        console.log(`Making POST request to ${input.endpoint}...`);
        const baseUrl = "http://simon-pc.bluehands.de/ScriptRunner/api3/3";
        const url = `${baseUrl}${input.endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'srx_e71af3fdf5b8d1cbbeecbdcd7847f549cd0bd1adee45258a5893331663243b61'
            },
            body: JSON.stringify(input.body)
        });
        const responseText = await response.text();
        console.log("Successfully started Action");
        return `Action successfully started`;
    } catch (error) {
        console.error("Error making POST request:", error);
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }  
}

// const test = startAction({endpoint: '/StartAction/3', body: {Disk: 'C:'}})

let step = 0;
let exit = false;

const messageHistory: ModelMessage[] = [
    {
        role: "system",
        content: `Du bist ein Run-Action Assistent.
        Du hilfst dem Benutzer, Actions zu starten.
        Die verfuegbaren Actions kannst du via getSwagger holen.
        Das solltest du immer machen.
        Versuche die Richtige Aktion aus dem Input und den Swagger Daten zu finden.
        Mache dem User einen Vorschlag. 
        Beende mit exit Tool wenn fertig.`
    },
    {
        role: "user",
        content: `Hallo, ich möchte mit der API arbeiten.`
    }
];

while (step < 10 && !exit) {
    const result = streamText({
        model: google('gemini-2.0-flash-lite'),
        messages: messageHistory,
        tools: {
            getSwagger: tool({
                description: "Get Swagger/OpenAPI documentation from the API",
                inputSchema: z.object({}),
                outputSchema: z.string(),
                execute: async () => {
                    try {
                        console.log("Fetching Swagger documentation...");
                        const response = await fetch(SWAGGER_URL, {
                            credentials: 'include',
                            method: 'GET'
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const swagger = await response.json();
                        return JSON.stringify(swagger, null, 2);
                    } catch (error) {
                        console.error("Error fetching Swagger:", error);
                        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    }
                }
            }),
            makePostRequest: tool({
                description: "Make a POST request to an API endpoint",
                inputSchema: startActionParamter,
                outputSchema: z.string(),
                execute: startAction
            }),
            askQuestion: tool({
                description: "Ask the user a question to get more information",
                inputSchema: z.object({
                    question: z.string().describe("The question to ask the user")
                }),
                outputSchema: z.string(),
                execute: async (input) => {
                    console.log(`\n${input.question}`);
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    const answer = await rl.question('Your answer: ');
                    rl.close();
                    return answer;
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
        }
    });

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }

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

