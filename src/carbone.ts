import got from "got";
import { SignaturePosition } from "./types.js";
import { CARBONE_API_KEY, CARBONE_API_URL, TEMPLATE_ID, templateData } from "./config.js";

interface CarboneRenderResponse {
    success: boolean;
    data: {
        renderId: string;
        signatures?: Array<{
            data: {
                type: string;
                email: string;
                recipientFirstname: string;
                recipientLastname: string;
            };
            page: number;
            x: number;
            y: number;
        }>;
    };
}

/**
 * Extract signature positions from CarboneIO v5 API JSON response
 * POST render always returns JSON with signatures in data.signatures array
 */
export function extractSignaturePositions(jsonBody: any): SignaturePosition[] {
    // CarboneIO v5 returns signatures in data.signatures array
    if (jsonBody.data && jsonBody.data.signatures && Array.isArray(jsonBody.data.signatures)) {
        const extracted: SignaturePosition[] = jsonBody.data.signatures.map((sig: any) => ({
            x: sig.x || 0,
            y: sig.y || 0,
            page: sig.page || 1,
            type: (sig.data?.type === "date" ? "date" : "signature") as "date" | "signature",
            email: sig.data?.email,
            recipientFirstname: sig.data?.recipientFirstname,
            recipientLastname: sig.data?.recipientLastname,
        }));
        console.log(`✓ Extracted ${extracted.length} signature position(s) from CarboneIO response`);
        return extracted;
    }

    return [];
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
        // POST render always returns JSON
        const response = await got.post<CarboneRenderResponse>(`${CARBONE_API_URL}/render/${TEMPLATE_ID}`, {
            headers: {
                authorization: `Bearer ${CARBONE_API_KEY}`,
                "carbone-version": "5",
                "content-type": "application/json",
            },
            json: dataToRender,
            responseType: "json",
        });

        // Extract signature positions from JSON response
        const signatures = extractSignaturePositions(response.body);

        // CarboneIO v5 returns renderId that we need to download
        if (!response.body.success || !response.body.data?.renderId) {
            throw new Error("Unexpected JSON response format from CarboneIO - missing renderId");
        }

        const renderId = response.body.data.renderId;

        // GET render always returns the document
        const downloadResponse = await got.get(`${CARBONE_API_URL}/render/${renderId}`, {
            headers: {
                "carbone-version": "5",
            },
            responseType: "buffer",
        });

        const pdfBuffer = downloadResponse.body;

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
