/*
  Warnings:

  - You are about to drop the column `name` on the `class` table. All the data in the column will be lost.
  - Added the required column `gradeId` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `section` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `class` DROP COLUMN `name`,
    ADD COLUMN `gradeId` INTEGER NOT NULL,
    ADD COLUMN `section` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Grade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gradeLevel` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `Grade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
