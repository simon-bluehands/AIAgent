import { google } from "@ai-sdk/google";
import { type ModelMessage, streamText, tool } from "ai";
import z from "zod";
import 'dotenv/config';
import { chefkochAPI, ChefkochAPI } from "chefkoch-api";
import * as readline from 'readline/promises';

const model = google('gemini-2.0-flash-lite');

const messageHistory: ModelMessage[] = [
    {
        role: 'system',
        content: ''
    },
    {
        role: 'user',
        content: 'Erstelle einen Essensplan'
    }
];

let steps = 0

while (steps < 10) {
    const result = streamText(
        {
            model: model,
            messages: messageHistory,
            tools: {
                searchChefkoch: {
                    inputSchema: z.object( { vegetarisch: z.boolean().describe('True wenn ein Vegetarier mit isst')}),
                    outputSchema: z.array(z.string()).describe('Gerichte'),
                    execute: (vegetarisch: boolean) => {
                        chefkochAPI.searchRecipes()

                    }
                }
            }
        }
    );
    
}





