-- CreateTable
CREATE TABLE "product_requirements" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "requirementsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_requirements_pkey" PRIMARY KEY ("id")
);
