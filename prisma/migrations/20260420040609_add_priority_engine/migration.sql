-- CreateTable
CREATE TABLE "PriorityEngineOutput" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "engineJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityEngineOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleSelection" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "engineOutputId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "selectedOption" JSONB NOT NULL,
    "regenerationCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSession" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "progress" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriorityEngineOutput_resultId_key" ON "PriorityEngineOutput"("resultId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSelection_resultId_moduleName_key" ON "ModuleSelection"("resultId", "moduleName");

-- CreateIndex
CREATE UNIQUE INDEX "AppSession_resultId_key" ON "AppSession"("resultId");

-- AddForeignKey
ALTER TABLE "PriorityEngineOutput" ADD CONSTRAINT "PriorityEngineOutput_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "diagnostic_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSelection" ADD CONSTRAINT "ModuleSelection_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "diagnostic_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleSelection" ADD CONSTRAINT "ModuleSelection_engineOutputId_fkey" FOREIGN KEY ("engineOutputId") REFERENCES "PriorityEngineOutput"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "diagnostic_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
