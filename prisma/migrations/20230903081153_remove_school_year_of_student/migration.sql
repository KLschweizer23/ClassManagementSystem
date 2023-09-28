/*
  Warnings:

  - You are about to drop the column `schoolYearId` on the `student` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `student` DROP FOREIGN KEY `Student_schoolYearId_fkey`;

-- AlterTable
ALTER TABLE `student` DROP COLUMN `schoolYearId`;
