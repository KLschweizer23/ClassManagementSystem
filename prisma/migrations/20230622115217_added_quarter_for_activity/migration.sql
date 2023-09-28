/*
  Warnings:

  - Added the required column `quarter` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `activity` ADD COLUMN `quarter` INTEGER NOT NULL;
