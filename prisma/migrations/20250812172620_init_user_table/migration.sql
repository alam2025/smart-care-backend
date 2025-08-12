/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bmdcNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `uuid` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `bmdcNumber` VARCHAR(191) NULL,
    ADD COLUMN `isDoctorVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `role` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `uuid` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_uuid_key` ON `User`(`uuid`);

-- CreateIndex
CREATE UNIQUE INDEX `User_bmdcNumber_key` ON `User`(`bmdcNumber`);
