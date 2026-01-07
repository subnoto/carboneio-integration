import dotenv from "dotenv";
import { SubnotoClient } from "@subnoto/api-client";

// Load environment variables from .env file
dotenv.config();

// CarboneIO API configuration
export const CARBONE_API_KEY = process.env.CARBONE_API_KEY || "";
export const CARBONE_API_URL = "https://api.carbone.io";
export const TEMPLATE_ID = process.env.CARBONE_TEMPLATE_ID || "";

// Initialize Subnoto client
export const subnotoClient = new SubnotoClient({
    apiBaseUrl: process.env.SUBNOTO_API_BASE_URL || "https://enclave.subnoto.com",
    accessKey: process.env.SUBNOTO_ACCESS_KEY || "",
    secretKey: process.env.SUBNOTO_SECRET_KEY || "",
});

export const WORKSPACE_UUID = process.env.SUBNOTO_WORKSPACE_UUID || "";

// JSON data for the template
export const templateData = {
    job_title: "Marketing director",
    start_date: "12/02/2025",
    fixed_term: false,
    end_date: "N/A",
    working_hours: "39",
    working_hours_period: "week",
    day_start_time: "9am",
    day_end_time: "6pm",
    health_insurance: true,
    retirement_plan: true,
    exlusivity: true,
    agreement: {
        start_date: "start_date5",
    },
    salary: {
        value: "54000 €",
        period: "year",
    },
    company: {
        name: "Acme Corporation",
        country: "United States",
        address: "123 Business St, 10001 New York",
        representative_name: "Jane Smith",
        representative_title: "Human Resources Manager",
        signature_date: {
            type: "date",
            email: "jane.smith@example.com",
            recipientFirstname: "Jane",
            recipientLastname: "Smith",
        },
        signature: {
            type: "signature",
            email: "jane.smith@example.com",
            recipientFirstname: "Jane",
            recipientLastname: "Smith",
        },
    },
    employee: {
        name: "John Doe",
        address: "456 Main St, 20001 Washington",
        signature_date: {
            type: "date",
            email: "john.doe@example.com",
            recipientFirstname: "John",
            recipientLastname: "Doe",
        },
        signature: {
            type: "signature",
            email: "john.doe@example.com",
            recipientFirstname: "John",
            recipientLastname: "Doe",
        },
    },
};
