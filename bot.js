let token = "BOT_TOKEN"
let botUrl = "https://api.telegram.org/bot" + token;
let placeholderFileId = "placeholder_imgID_on_telegram_server"

let adminId = "1234567"


/**TODO
 * 
 * ///KLAR- hämta pris på fonder (sönder, annan sida)
 * 
 * //KLAR /list
 * - uppdateringar på innehav, ("tesla +5%") tider?
 *     - "Utveckling idag"
 *      - knappar sorterade mest-minst.  tesla (2%)
 * 
 * 
 * - inställningar
 * - 
 * 
 * changePercent
 * https://query1.finance.yahoo.com/v8/finance/chart/TSLA?region=US&lang=en-US&includePrePost=false&interval=2m&useYfid=true&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance
 * Realtime data
 * 
 * 
 *
 * 
 * 
 * KLAR?
 * - nyheter hämtas ibland dubbelt
 */


function abc(){
  //sendMessage(adminId, SpreadsheetApp.openById(sheetId).getUrl())
  print(sendStockInfo(adminId, "Scandic Hotels Group"))
}

/**
 * Testdata
 */
let exampleMessage = "Sluta följa New Gold Inc"
let exampleData2 = {postData: {contents: JSON.stringify({"message":{"chat":{"id":adminId}, "text": exampleMessage}})}}

let exampleData = {}




/**
 * Körs när en uppdatering har upptäckts
 */
function doPost(e = exampleData){

  let data = parseUpdate(e)
  let text = data.text //små bokstäver
  let id = data.id
  if(id == adminId) log(e.postData.contents)
  let name = data.name
  let caseSensitive = data.caseSensitive
  let m = data.m
  let messageId = (m) ? data.m.message_id : undefined

  updateLastSeen(id)


  //ANVÄNDAREN FÖRSÖKER SÖKA PÅ AKTIE
  if(data.query_id){
    //skicka sökresultat
    displaySearchResults(data.query_id, data.query)
    if(name) {updateName(id, name)}
    return htmlOK()
  }

  //SHOW BOT IS THINKING
  sendTypingAnimation(id)


  //ANVÄNDAREN SKICKAR NAMNET PÅ EN AKTIE
  if(data.m.via_bot && data.m.via_bot.first_name == "aktienyheter"){

    sendStockInfo(id, caseSensitive)
    return htmlOK()
    //om användaren redan följer aktien, kontrollera då om hon vill avfölja
  }

  if(text[0] == "/") text = text.slice(1)

  switch(text){
    case "hej":
      sendMessage(id, "hej")
    return htmlOK()

    case "sök":
    case "search":
      sendMessage(id, "Sök aktier att följa.", [[{text:"Sök aktie/fond", insert_in_chat: ""}]])
    return htmlOK()

    case "help":
    case"hjälp":
      sendMessage(id, )
    return htmlOK()

    case "start":
     //skicka information, hur fungerar appen?
     newUser(id, name)
     sendMessage(id, "Börja med att följa några aktier. Du kommer då att få de nyheter som är relevanta för just dig.", [[{text:"Sök aktie/fond", insert_in_chat: ""}]])
    return htmlOK()

    case "inställningar":
    case "settings":

    return htmlOK()

    case "debug":
    if(id==adminId) sendMessage(adminId, SpreadsheetApp.openById(sheetId).getUrl())
    return htmlOK()

//VISAR ALLA UTVECKLINGEN FÖR DE AKTIER ID FÖLJER
    case "list":
      compare = (a, b)  => parseFloat(clip(b[0], "(", " %")) - parseFloat(clip(a[0], "(", " %"))
      let buttons = getUserStockData(id).map(x => [x + " ("+getStockPriceChange(searchStocks(x)[0].url)+ ")"]).sort(compare)
      sendMessage(id, "Nedan följer dagens utveckling av de aktier/fonder du följer. Tryck för att se mer.", buttons)
    return htmlOK()
  }

//SLUTA FÖLJA
  if(text.includes("sluta följa")){
    let stock = caseSensitive.slice(12)
    removeStockFromFollowList(id, stock)

    let buttons = m.reply_markup.inline_keyboard;    buttons[2][0] = "Följ " + stock
    editMessageKeyboard(id, m.message_id,  buttons)

    sendMessage(id, "Du kommer inte längre få uppdateringar gällande  <code>" + stock + "</code>")
    return htmlOK()
  }

//FÖLJ
  else if(text.includes("följ")){
    let stock = caseSensitive.slice(5)
    addStockToFollowList(id, stock)

    let buttons = m.reply_markup.inline_keyboard;    buttons[2][0] = "Sluta följa " + stock

    editMessageKeyboard(id, m.message_id, buttons)
    sendMessage(id, "Du kommer nu att få uppdateringar gällande  <code>" + stock + '</code>\nDu kan alltid skriva "sök" för att lägga till fler aktier', [[{text:"Sök aktie/fond", insert_in_chat: ""}]])
    return htmlOK()
  }

//TRYCKER PÅ "TESLA (-2 %) -> VISA TESLA"
  else if(clip(text, "(", ")").includes("%")){
    sendStockInfo(id, caseSensitive.slice(0, text.indexOf("(")-1))
    return htmlOK()
  }



//ANVÄNDAREN ÄNDRAR UPPLÖSNING PÅ GRAF
  if(messageId && m.caption && m.caption.includes("Utveckling idag")){
    let stockName = m.caption.slice(0, m.caption.indexOf("Utveckling idag")-3)

    stockData = searchStocks(stockName)[0]
    let timePeriodIndex = m.reply_markup.inline_keyboard[0].map(x => x.text).indexOf(m.text) //knappens index på första raden

    drawGraph(id, m, stockData.url, timePeriodIndex)
    return htmlOK()
  }


  sendMessage(id, "Denna funktionen har inte implementerats. \n/hjälp")
  return htmlOK()


}


async function drawGraph(id, message, stockUrl, timePeriod=3){
  let graph = createGraph(stockUrl, timePeriod)
  let photoMessage = sendPhoto(id, graph.img, "", [], false)

  deleteMessage(id, photoMessage)
  let file_id = photoMessage.photo[1].file_id
  editMessageMedia(id, message, file_id)
  let buttons = message.reply_markup.inline_keyboard


  if(buttons.length == 2) buttons.unshift(graph.allowedTimePeriods)

  editMessageKeyboard(id, message.message_id, buttons)
}

function sendStockInfo(id, stockName){
    stockData = searchStocks(stockName)[0]
    let buttonText = "Följ"

    if(getUserStockData(id).indexOf(stockName) != -1) buttonText = "Sluta följa"
    let buttons = [[{text:"Öppna i Avanza", url: stockData.url}],
    //[{text:"se MACD, MA20/50 m.m.", url: yahooUrl(getIdentifier(stockData.url))}], 
    [buttonText + " " + stockData.name]]

    let message = sendPhoto(id, placeholderFileId,"<b>" + stockData.name + "</b>" + " <code> \nUtveckling idag: " + getStockPriceChange(stockData.url) + "</code>", buttons)

    drawGraph(id, message, stockData.url)
}



/**
 * uppdates every 15min checks for new articles/telegrams
 */
function checkForUpdates(){
  (getNewTelegrams() || []).map(t => sendTelegram(t));
  (getNewArticles() || []).map(a => sendUpdate(a));
}

function sendUpdate(article){
  if(!article.stocks && !sendAlways(a)) return
  var users = getAllUsersWithStockFollowInfo(safemode=false);
  users.map(u => u.relevantStocks = []);

  //create a list with users, containing 
  if(article.stocks) {article.stocks.forEach(s => {
    users.filter(u => u.follows.includes(s)).map(u => u.relevantStocks.push(s)) //TODO: hämta changePercent här istället, bättre med många användare.
  })}

  function sendAlways(a){
    let types = ["Morgonrapport", "Aktieanalys"]
    let headers = ["aktierekar"]
    return types.includes(a.type) || headers.includes(a.header)
  }
  //ta bort användare som artikeln inte ska skickas till
  if(!sendAlways(article)) users = users.filter(u => u.relevantStocks.length != 0)



  users.map(u => /*{try*/{
    sendPhoto(u.id.toString(), 
  article.img, "<b>" + article.header + '</b>\n<code>➤ ' + article.type + "</code>" + article.comment + "\n<code>Läs mer ↴</code>",
   u.relevantStocks.map(s => [s + " (" + getStockPriceChange(searchStocks(s)[0].url)+")"]).concat([[{text: "Öppna artikeln i webbläsaren", url: article.url}]]))
   }/*catch(e){log("ERR: " + u.id + " " + e)}}*/);
}

function sendTelegram(telegram){

  if(!telegram.stocks) return
  var users = getAllUsersWithStockFollowInfo(safemode=false);
  users.map(u => u.relevantStocks = []);

  //create a list with users, containing 
  if(telegram.stocks) {telegram.stocks.forEach(s => {
    users.filter(u => u.follows.includes(s)).map(u => u.relevantStocks.push(s)) //TODO: hämta changePercent här istället, bättre med många användare.
  })}
  function sendAlways(t){
    let headers = []
    let comments = []
    return headers.includes(t.header) || comments.includes(t.comment)
  }
  if(!sendAlways(telegram)) users = users.filter(u => u.relevantStocks.length != 0)

  users.map(u => {try{
    sendMessage(
      u.id.toString(),
      "<b>" + telegram.header + "</b>\n" + telegram.comment + "\n\n<code>"+telegram.stocks.join(", ")+"</code>",
      u.relevantStocks.map(s => [s + " (" + getStockPriceChange(searchStocks(s)[0].url)+")"]).concat([[{text: "Öppna artikeln i webbläsaren", url: telegram.url}]]),       
      notification=false)
   }catch(e){log("ERR: " + u.id + " " + e)}})
}


