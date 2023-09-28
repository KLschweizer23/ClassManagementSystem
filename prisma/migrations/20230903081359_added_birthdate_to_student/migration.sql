/*
  Warnings:

  - Added the required column `birthDate` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `student` ADD COLUMN `birthDate` DATETIME(3) NOT NULL;
