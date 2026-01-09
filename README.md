# CarboneIO x Subnoto Integration Demo

This project demonstrates the integration between [CarboneIO](https://carbone.io/) (document generation) and [Subnoto](https://subnoto.com/) (electronic signatures).

## Overview

The application generates a PDF document using CarboneIO with signature fields, extracts signature positions from the CarboneIO response, creates an envelope in Subnoto, adds signature blocks based on the extracted positions, and sends the envelope for signing.

Full documentation is available in the tutorial [Integrate CarboneIO with Subnoto](https://subnoto.com/documentation/developers/integrations/carboneio).

## Prerequisites

-   Node.js 18+
-   pnpm
-   CarboneIO API key
-   Subnoto API credentials (access key, secret key, workspace UUID)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```
CARBONE_API_KEY=your_carbone_api_key_here
SUBNOTO_API_BASE_URL=https://enclave.subnoto.com
SUBNOTO_ACCESS_KEY=your_subnoto_access_key_here
SUBNOTO_SECRET_KEY=your_subnoto_secret_key_here
SUBNOTO_WORKSPACE_UUID=your_subnoto_workspace_uuid_here
```

## Usage

Development mode:

```bash
pnpm dev
```

Production mode:

```bash
pnpm build
pnpm start
```

## How It Works

1. Generates a PDF using CarboneIO template with signature placeholders (using `:sign` format)
2. Extracts signature positions from the CarboneIO response metadata
3. Uploads the PDF to Subnoto and creates an envelope
4. Maps CarboneIO signature positions to Subnoto signature blocks
5. Sends the envelope to recipients for signing

## References

-   [CarboneIO Documentation](https://carbone.io/documentation)
-   [Subnoto API Documentation](https://subnoto.com/documentation/developers/sdks/typescript)
