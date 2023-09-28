/*
  Warnings:

  - Added the required column `activityName` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `activity` ADD COLUMN `activityName` VARCHAR(191) NOT NULL;
