
var telegramSheetInstance = undefined
/**
 * Stores telegram sheet if used multiple times
 * @returns (SpreadsheetApp.Sheet) telegramsheet instance
 */
function telegramSheet(){
  if(!telegramSheetInstance) telegramSheetInstance = sheet("telegrams")
  return telegramSheetInstance
}


/**
 * 
 * TIME LACKS LAST NUMBER??
 * 
 */


/**
 * checks for new telegrams and adds them to the database
 * {header, stocks, url, time}
 * @return {array} all new telegrams 
 */
function getNewTelegrams(){
  let telegrams = downloadTelegrams().slice(0, 50)
  let old = todaysTelegrams()
  
    //ONLY TODAY
  telegrams = telegrams.filter(a => a.time.includes(getDate()))
  //ONLY NEW

  telegrams = telegrams.map(x => ((old.findIndex(y => y.header == x.header) == -1)) ? x : null).filter(x=>x!=null)


  telegrams.forEach(x => x.stocks = gatherTelegramLinkedStocks(x.url))
  for(t of telegrams.reverse()){
    writeTelegram(t)
  }
  return telegrams.reverse()
}

/**
 * @param {int} index - which telegram to read, starting at 0
 * @returns {telegramObj}
 */
function readTelegram(index = 0){
  return JSON.parse(telegramSheet().getRange(index+1, 1, 1, 2).getValues()[0][1] || "{}")  
}
function todaysTelegrams(){
  return sheet("telegrams").getRange(1, 2, 150, 1).getValues().map(x => JSON.parse(x[0] || '{"time":""}')).filter(x=>x).filter(x => x.time.includes(getDate()))
}

/**
 * adds telegram to database
 * @param {object} telegramObj - telegram data
 */
function writeTelegram(telegramObj){
  telegramSheet().insertRowBefore(1).getRange(1, 1, 1, 2).setValues([[telegramObj.time, JSON.stringify(telegramObj)]]);
}
