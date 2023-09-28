/*
  Warnings:

  - Added the required column `activityId` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `score` ADD COLUMN `activityId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
