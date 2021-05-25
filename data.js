let sheetId = "abcdefg1234567"

/**
 * @returns {SpreadsheetApp.Sheet}
 */
function sheet(sheetName){
  return SpreadsheetApp.openById(sheetId).getSheetByName(sheetName)
}

