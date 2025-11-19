import z from "zod";

export interface Employee {
    id: number;
    name: string;
    department: string;
    foodPreferences: string[];
    allergies: string[];
}

// Tool input/output schemas
export const GetEmployeesInputSchema = z.object({
    department: z.string().optional().describe("Filter by department (optional)")
});

export const EmployeeSchema = z.object({
    id: z.number(),
    name: z.string(),
    department: z.string(),
    foodPreferences: z.array(z.string()).describe('Food Preferences'),
    allergies: z.array(z.string())
});

export const GetEmployeesOutputSchema = z.array(EmployeeSchema).describe("List of employees with their food preferences");

export const SearchChefkochInputSchema = z.object({
    query: z.string().describe('Search string for recipes')
});

export const SearchChefkochOutputSchema = z.array(z.string()).describe('Gerichte');

export type SearchChefkochInput = z.infer<typeof SearchChefkochInputSchema>;
export type SearchChefkochOutput = z.infer<typeof SearchChefkochOutputSchema>;

export const SearchTavilyInputSchema = z.object({
    query: z.string().describe('Search query for web search')
});

export const SearchTavilyOutputSchema = z.array(z.object({
    title: z.string(),
    url: z.string(),
    content: z.string()
})).describe('Search results from Tavily');

export type SearchTavilyInput = z.infer<typeof SearchTavilyInputSchema>;
export type SearchTavilyOutput = z.infer<typeof SearchTavilyOutputSchema>;
