import { openai } from '@ai-sdk/openai';
import { type Employee } from './ai-agent.types.js';

// Mock data
export const mockEmployees: Employee[] = [
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

export const model = openai('gpt-4o');
