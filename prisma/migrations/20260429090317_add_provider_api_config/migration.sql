-- AlterTable
ALTER TABLE "api_sync_logs" ADD COLUMN     "isMock" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "provider_api_configs" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "apiType" TEXT NOT NULL DEFAULT 'SUSHI_R51',
    "counterVersion" TEXT NOT NULL DEFAULT '5.1',
    "baseUrl" TEXT NOT NULL,
    "fallbackUrl" TEXT,
    "endpoint" TEXT,
    "reportType" TEXT NOT NULL DEFAULT 'DR',
    "customerId" TEXT,
    "requestorId" TEXT,
    "apiKeyEncoded" TEXT,
    "apiKeyMasked" TEXT,
    "tokenEncoded" TEXT,
    "tokenMasked" TEXT,
    "headersJson" JSONB,
    "queryParamsJson" JSONB,
    "defaultBeginDate" TEXT,
    "defaultEndDate" TEXT,
    "mockMode" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestMessage" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncRows" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_api_configs_providerId_key" ON "provider_api_configs"("providerId");

-- AddForeignKey
ALTER TABLE "provider_api_configs" ADD CONSTRAINT "provider_api_configs_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
