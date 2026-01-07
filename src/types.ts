export interface SignaturePosition {
    x: number;
    y: number;
    page: number;
    type: "signature" | "date";
    email?: string;
    recipientFirstname?: string;
    recipientLastname?: string;
}

