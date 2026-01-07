import got from "got";
import { SignaturePosition } from "./types.js";
import { CARBONE_API_KEY, CARBONE_API_URL, TEMPLATE_ID, templateData } from "./config.js";

/**
 * Extract signature positions from CarboneIO v5 API response
 * CarboneIO v5 returns signature metadata in response headers or JSON body when using :sign format
 */
export function extractSignaturePositions(response: { headers: any; body?: Buffer | any }): SignaturePosition[] {
    const signatures: SignaturePosition[] = [];

    // CarboneIO v5 returns signature metadata in headers
    // Check for signature-related headers
    const signatureHeader = response.headers["carbone-signatures"] || response.headers["x-carbone-signatures"];

    if (signatureHeader) {
        try {
            const signatureData = typeof signatureHeader === "string" ? JSON.parse(signatureHeader) : signatureHeader;

            if (Array.isArray(signatureData)) {
                const extracted: SignaturePosition[] = signatureData.map((sig: any) => ({
                    x: sig.x || sig.left || 0,
                    y: sig.y || sig.top || 0,
                    page: sig.page || 1,
                    type: (sig.type === "date" ? "date" : "signature") as "date" | "signature",
                    email: sig.email,
                    recipientFirstname: sig.recipientFirstname,
                    recipientLastname: sig.recipientLastname,
                }));
                console.log(`✓ Extracted ${extracted.length} signature position(s) from CarboneIO response`);
                return extracted;
            }
        } catch (e) {
            console.warn("Failed to parse signature header:", e);
        }
    }

    // Check if body is JSON and contains signatures
    if (response.body && typeof response.body === "object" && !Buffer.isBuffer(response.body)) {
        const jsonBody = response.body;

        // CarboneIO v5 returns signatures in data.signatures array
        if (jsonBody.data && jsonBody.data.signatures && Array.isArray(jsonBody.data.signatures)) {
            const extracted: SignaturePosition[] = jsonBody.data.signatures.map((sig: any) => ({
                x: sig.x || sig.left || 0,
                y: sig.y || sig.top || 0,
                page: sig.page || 1,
                type: (sig.data?.type === "date" ? "date" : "signature") as "date" | "signature",
                email: sig.data?.email,
                recipientFirstname: sig.data?.recipientFirstname,
                recipientLastname: sig.data?.recipientLastname,
            }));
            console.log(`✓ Extracted ${extracted.length} signature position(s) from CarboneIO response`);
            return extracted;
        }

        // Fallback: check for signatures at root level
        if (jsonBody.signatures && Array.isArray(jsonBody.signatures)) {
            const extracted: SignaturePosition[] = jsonBody.signatures.map((sig: any) => ({
                x: sig.x || sig.left || 0,
                y: sig.y || sig.top || 0,
                page: sig.page || 1,
                type: (sig.data?.type === "date" ? "date" : "signature") as "date" | "signature",
                email: sig.data?.email,
                recipientFirstname: sig.data?.recipientFirstname,
                recipientLastname: sig.data?.recipientLastname,
            }));
            console.log(`✓ Extracted ${extracted.length} signature position(s) from CarboneIO response`);
            return extracted;
        }
    }

    return signatures;
}

/**
 * Generate PDF using CarboneIO v5 API directly
 */
export async function generatePDFWithCarbone(): Promise<{ buffer: Buffer; signatures: SignaturePosition[] }> {
    const dataToRender = {
        data: templateData,
        convertTo: "pdf",
    };

    try {
        const response = await got.post(`${CARBONE_API_URL}/render/${TEMPLATE_ID}`, {
            headers: {
                authorization: `Bearer ${CARBONE_API_KEY}`,
                "carbone-version": "5",
                "content-type": "application/json",
            },
            json: dataToRender,
            responseType: "buffer",
        });

        // Check if response is JSON (might contain download link or base64 PDF)
        const contentType = response.headers["content-type"] || "";
        let pdfBuffer: Buffer;
        let signatures: SignaturePosition[] = [];

        if (contentType.includes("application/json")) {
            // Response is JSON, parse it
            const jsonResponse = JSON.parse(response.body.toString());

            // CarboneIO v5 returns renderId that we need to download
            if (jsonResponse.success && jsonResponse.data && jsonResponse.data.renderId) {
                const renderId = jsonResponse.data.renderId;

                // Download the PDF using the renderId (endpoint is /render/{renderId}, not /download/{renderId})
                const downloadResponse = await got.get(`${CARBONE_API_URL}/render/${renderId}`, {
                    headers: {
                        "carbone-version": "5",
                        // Authorization not required for download endpoint
                    },
                    responseType: "buffer",
                });

                pdfBuffer = downloadResponse.body;
            } else {
                throw new Error("Unexpected JSON response format from CarboneIO - missing renderId");
            }

            // Extract signature positions from JSON response
            signatures = extractSignaturePositions({
                headers: response.headers,
                body: jsonResponse,
            });
        } else {
            // Response is directly PDF
            pdfBuffer = response.body;

            // Extract signature positions from response headers
            signatures = extractSignaturePositions({
                headers: response.headers,
                body: response.body,
            });
        }

        // Verify it's a valid PDF
        if (pdfBuffer.length < 4 || pdfBuffer.slice(0, 4).toString() !== "%PDF") {
            throw new Error("Response is not a valid PDF. First bytes: " + pdfBuffer.slice(0, 50).toString());
        }

        console.log(`✓ PDF generated successfully (${pdfBuffer.length} bytes)`);
        return { buffer: pdfBuffer, signatures };
    } catch (error: any) {
        throw new Error(`CarboneIO API error: ${error.message || JSON.stringify(error)}`);
    }
}
