import 'dotenv/config';
import { streamText, type ModelMessage } from "ai";
import z from "zod";
import { chefkochAPI } from "chefkoch-api";
import * as readline from 'readline/promises';
import { model, mockEmployees } from './ai-agent.constants.js';
import { SearchChefkochInputSchema, SearchChefkochOutputSchema, type SearchChefkochInput, type SearchChefkochOutput } from './ai-agent.types.ts';

let steps = 0

const messageHistory: ModelMessage[] = [
    {
        role: 'system',
        content: `Your task is to plan the meals for the next week
                  You can get the employees with their food preferences
                  You can search a recipe base
                  The Plan is for all Employees that are returned from the GetEmployee Tool
                  Try everything not to ask questions!
                  Output the Meal plan in the Form Day: Meal (<Ingredients>)
                `

    },
    {
        role: 'user',
        content: 'Create a Meal plan for the next week'
    }
];

while (steps < 4) {
    const result = streamText(
        {
            model: model,
            messages: messageHistory,
            tools: {
                getEmployeesWithPreferences: {
                    description: "Get a list of all employees with their food preferences and allergies",
                    inputSchema: z.object({}),
                    outputSchema: z.string().describe('List of Employees with food preferences'),
                    execute: async (): Promise<string> => {
                        console.log("Employee Tool called")
                        return JSON.stringify(mockEmployees);
                    }
                },
                searchChefkoch: {
                    description: "Search for recipes on Chefkoch",
                    inputSchema: SearchChefkochInputSchema,
                    outputSchema: SearchChefkochOutputSchema,
                    execute: async (input: SearchChefkochInput): Promise<SearchChefkochOutput> => {
                        console.log(input.query);
                        const result = await chefkochAPI.searchRecipes(input.query)
                        return result.map((g) => g.name as string);
                    }
                }
            }
        }
    );
   for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }

    const finishReason = await result.finishReason;

    if(finishReason === 'tool-calls') {
        const response = await result.response;
        messageHistory.push(...response.messages);
    }
   
    
    if (finishReason === "stop") {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const answer = await rl.question('Your input: ');
            rl.close();
            messageHistory.push({ role: "user", content: answer });
    }

    steps++
}





