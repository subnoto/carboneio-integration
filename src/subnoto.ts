import { SignaturePosition } from "./types.js";
import { subnotoClient, WORKSPACE_UUID } from "./config.js";

/**
 * Create envelope in Subnoto from PDF file
 */
export async function createSubnotoEnvelope(
    pdfBuffer: Buffer
): Promise<{ envelopeUuid: string; documentUuid: string }> {
    // Use the uploadDocument helper method which properly handles multipart/form-data
    const result = await subnotoClient.uploadDocument({
        workspaceUuid: WORKSPACE_UUID,
        fileBuffer: pdfBuffer,
        envelopeTitle: "Employment Contract",
    });

    console.log(`✓ Envelope created in Subnoto: ${result.envelopeUuid}`);
    return { envelopeUuid: result.envelopeUuid, documentUuid: result.documentUuid };
}

/**
 * Add recipients and signature blocks to the envelope
 */
export async function addRecipientsAndBlocks(
    envelopeUuid: string,
    documentUuid: string,
    signatures: SignaturePosition[]
): Promise<void> {
    // Collect unique recipients based on emails
    const recipientMap = new Map<string, { email: string; firstname: string; lastname: string }>();

    signatures.forEach((sig) => {
        if (sig.email && !recipientMap.has(sig.email)) {
            // Use recipientFirstname and recipientLastname from signature data
            recipientMap.set(sig.email, {
                email: sig.email,
                firstname: sig.recipientFirstname || sig.email.split("@")[0].split(".")[0] || "User",
                lastname: sig.recipientLastname || sig.email.split("@")[0].split(".")[1] || "",
            });
        }
    });

    // Add recipients to envelope
    if (recipientMap.size > 0) {
        try {
            const recipients = Array.from(recipientMap.values()).map((r) => ({
                type: "manual" as const,
                email: r.email,
                firstname: r.firstname || "User",
                lastname: r.lastname || "",
            }));

            const response = await subnotoClient.POST("/public/envelope/add-recipients", {
                body: {
                    workspaceUuid: WORKSPACE_UUID,
                    envelopeUuid,
                    recipients,
                },
            });

            if (response.error) {
                throw new Error(`Failed to add recipients: ${JSON.stringify(response.error)}`);
            }

            console.log(`✓ Added ${recipients.length} recipient(s) to envelope`);
        } catch (error) {
            console.warn(`Warning: Could not add recipients:`, error);
            throw error;
        }
    }

    // Add signature blocks
    const blocks = signatures
        .filter((sig) => sig.type === "signature") // Only signature blocks for now (date blocks not supported in Subnoto)
        .map((sig) => ({
            type: "signature" as const,
            page: String(sig.page),
            x: sig.x,
            y: sig.y,
            recipientEmail: sig.email,
        }));

    if (blocks.length > 0) {
        try {
            console.log("\n📍 Signature block coordinates:");
            blocks.forEach((block, index) => {
                console.log(
                    `  Block ${index + 1}: page=${block.page}, x=${block.x}, y=${block.y}, recipient=${
                        block.recipientEmail
                    }`
                );
            });

            const response = await subnotoClient.POST("/public/envelope/add-blocks", {
                body: {
                    workspaceUuid: WORKSPACE_UUID,
                    envelopeUuid,
                    documentUuid,
                    blocks,
                },
            });

            if (response.error) {
                throw new Error(`Failed to add blocks: ${JSON.stringify(response.error)}`);
            }

            console.log(`✓ Added ${blocks.length} signature block(s) to envelope`);
        } catch (error) {
            console.warn(`Warning: Could not add signature blocks:`, error);
            throw error;
        }
    }
}

/**
 * Send the envelope
 */
export async function sendEnvelope(envelopeUuid: string): Promise<void> {
    const response = await subnotoClient.POST("/public/envelope/send", {
        body: {
            workspaceUuid: WORKSPACE_UUID,
            envelopeUuid,
        },
    });

    if (response.error) {
        throw new Error(`Subnoto send error: ${JSON.stringify(response.error)}`);
    }

    console.log(`✓ Envelope sent successfully: ${envelopeUuid}`);
}
