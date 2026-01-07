import { generatePDFWithCarbone } from "./carbone.js";
import { createSubnotoEnvelope, addRecipientsAndBlocks, sendEnvelope } from "./subnoto.js";
import { CARBONE_API_KEY, TEMPLATE_ID, WORKSPACE_UUID } from "./config.js";

/**
 * Main execution flow
 */
async function main() {
    try {
        console.log("Starting CarboneIO to Subnoto integration...\n");

        // Validate environment variables
        if (!CARBONE_API_KEY) {
            throw new Error("CARBONE_API_KEY is not set in environment variables");
        }
        if (!TEMPLATE_ID) {
            throw new Error("CARBONE_TEMPLATE_ID is not set in environment variables");
        }
        if (!process.env.SUBNOTO_ACCESS_KEY || !process.env.SUBNOTO_SECRET_KEY) {
            throw new Error("Subnoto credentials are not set in environment variables");
        }
        if (!WORKSPACE_UUID) {
            throw new Error("SUBNOTO_WORKSPACE_UUID is not set in environment variables");
        }

        // Step 1: Generate PDF with CarboneIO
        console.log("Step 1: Generating PDF with CarboneIO...");
        const { buffer, signatures } = await generatePDFWithCarbone();

        // Step 2: Create envelope in Subnoto
        console.log("\nStep 2: Creating envelope in Subnoto...");
        const { envelopeUuid, documentUuid } = await createSubnotoEnvelope(buffer);

        // Step 3: Add recipients and signature blocks
        console.log("\nStep 3: Adding recipients and signature blocks...");
        await addRecipientsAndBlocks(envelopeUuid, documentUuid, signatures);

        // Step 4: Send envelope
        console.log("\nStep 4: Sending envelope...");
        await sendEnvelope(envelopeUuid);

        console.log("\n✅ Process completed successfully!");
        console.log(`Envelope UUID: ${envelopeUuid}`);
    } catch (error) {
        console.error("\n❌ Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// Run the main function
main();
