import { google } from "@ai-sdk/google";
import { type ModelMessage, streamText, tool } from "ai";
import z from "zod";
import 'dotenv/config';
import { chefkochAPI, ChefkochAPI } from "chefkoch-api";
import * as readline from 'readline/promises';

// ============ Types & Schemas ============

// Employee type
interface Employee {
    id: number;
    name: string;
    department: string;
    foodPreferences: string[];
    allergies: string[];
}

// Tool input/output schemas
const GetEmployeesInputSchema = z.object({
    department: z.string().optional().describe("Filter by department (optional)")
});

const EmployeeSchema = z.object({
    id: z.number(),
    name: z.string(),
    department: z.string(),
    foodPreferences: z.array(z.string()).describe('Food Preferences'),
    allergies: z.array(z.string())
});

const GetEmployeesOutputSchema = z.array(EmployeeSchema).describe("List of employees with their food preferences");

const SearchChefkochInputSchema = z.object({
    query: z.string().describe('Search string for recipes')
});

const SearchChefkochOutputSchema = z.array(z.string()).describe('Gerichte');

// Types for execute functions
type GetEmployeesInput = z.infer<typeof GetEmployeesInputSchema>;
type GetEmployeesOutput = z.infer<typeof GetEmployeesOutputSchema>;

type SearchChefkochInput = z.infer<typeof SearchChefkochInputSchema>;
type SearchChefkochOutput = z.infer<typeof SearchChefkochOutputSchema>;

// ============ Mock Data ============

const mockEmployees: Employee[] = [
    {
        id: 1,
        name: "Alice Johnson",
        department: "Engineering",
        foodPreferences: ["Pasta", "Salad", "Chicken"],
        allergies: ["Peanuts"]
    },
    {
        id: 2,
        name: "Bob Smith",
        department: "Marketing",
        foodPreferences: ["Vegetarian", "Indian", "Rice Bowls"],
        allergies: ["Dairy"]
    },
    {
        id: 3,
        name: "Carol Williams",
        department: "Sales",
        foodPreferences: ["Sushi", "Fish", "Asian Cuisine"],
        allergies: []
    },
    {
        id: 4,
        name: "David Brown",
        department: "Engineering",
        foodPreferences: ["Burgers", "Pizza", "Meat"],
        allergies: ["Shellfish"]
    },
    {
        id: 5,
        name: "Eva Martinez",
        department: "HR",
        foodPreferences: ["Vegan", "Mediterranean", "Fruits"],
        allergies: []
    },
    {
        id: 6,
        name: "Frank Chen",
        department: "Finance",
        foodPreferences: ["Chinese", "Noodles", "Spicy Food"],
        allergies: ["Sesame"]
    }
];

const model = google('gemini-2.0-flash-lite');

const messageHistory: ModelMessage[] = [
    {
        role: 'system',
        content: `Your task is to plan the meals for the next week
                  You can get the employees with their food preferences
                  You can search a recipe base 
                  The Plan is for all Employees that are returned from the GetEmployee Tool
                  Try everything not to ask questions!
                `
            
    },
    {
        role: 'user',
        content: 'Erstelle einen Essensplan'
    }
];

let steps = 0

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
    
    if (finishReason === "stop") {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const answer = await rl.question('Your input: ');
            rl.close();
            messageHistory.push({ role: "user", content: answer });
    }

    steps++
}





