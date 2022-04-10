const xlsx = require("xlsx");
const path = require("path");

const exportExcel = (data, workSheetColumnNames, workSheetName, filePath) => {
  const workbook = xlsx.utils.book_new();
  const workSheetData = [workSheetColumnNames, ...data];

  const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);

  workSheet["!cols"] = [{ wch: 70 }, { wch: 50 }];

  xlsx.utils.book_append_sheet(workbook, workSheet, workSheetName);

  xlsx.writeFile(workbook, path.resolve(filePath));
};

const exportUsersToExcel = (
  users,
  workSheetColumnNames,
  workSheetName,
  filePath
) => {
  const data = users.map((user) => {
    return [user.name, user.email];
  });

  exportExcel(data, workSheetColumnNames, workSheetName, filePath);
};

module.exports = exportUsersToExcel;
