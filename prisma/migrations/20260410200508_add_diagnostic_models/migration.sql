-- CreateEnum
CREATE TYPE "DiagnosticSessionStatus" AS ENUM ('created', 'in_progress', 'ready_to_finalize', 'finalizing', 'completed', 'error');

-- CreateEnum
CREATE TYPE "ProfileSelected" AS ENUM ('entrepreneur', 'salarie', 'independant', 'createur');

-- CreateTable
CREATE TABLE "diagnostic_sessions" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profil_selected" "ProfileSelected" NOT NULL,
    "status" "DiagnosticSessionStatus" NOT NULL DEFAULT 'created',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "last_diagnostic_state" JSONB,
    "result_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profil_selected" "ProfileSelected" NOT NULL,
    "diagnostic_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostic_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_sessions_result_id_key" ON "diagnostic_sessions"("result_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnostic_results_session_id_key" ON "diagnostic_results"("session_id");

-- AddForeignKey
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "diagnostic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
