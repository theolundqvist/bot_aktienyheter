/**
 * Skickar ett meddelande med svarsalternativ under
 * @param {string=} id - User id
 * @param {string=} text - Message text
 * @param {array=} buttons - Button text or {text: "", url?: "", insert_in_chat?: ""}, array is rows and cols [[],[]], max one optional
 */
function sendMessage(id=adminId, text="fråga", buttons = [[]], notification=true){
  var url = botUrl + "/sendMessage?";
  
  return JSON.parse(fetch(url,{"chat_id":id, "text": text,disable_notification: !notification, "parse_mode":"HTML", "reply_markup": parseInlineKeyboard(buttons)})).result
}

/**
 * Skickar ett photo med text
 * @param {string=} id - User id
 * @param {any=} img - url or file
 * @param {string=} text - image caption
 * @param {array=} buttons - Button text or {text: "", url?: "", insert_in_chat?: ""}, array is rows and cols, max one optional(?)
 */
function sendPhoto(id=adminId, img, text, buttons, notification=true){
  var url = botUrl + "/sendPhoto?"
  return JSON.parse(fetch(url, {chat_id:id, caption:text, disable_notification: !notification,photo: img, parse_mode:"HTML",reply_markup: parseInlineKeyboard(buttons)})).result
}


/**
 * Skickar ett meddelande med svarsalternativ istället för tangentbord
 * @param {string=} id - User id
 * @param {string=} text - Message text
 * @param {array=} buttons - Button text
 */
function sendMultipleChoice(id=adminId, text="fråga", buttons=["1","2"], notification=true){
  var url = botUrl + "/sendMessage?";
  var keys = buttons.map(x => [{"text": x}])
  
  var keyboard = {
    "keyboard": keys,
    "one_time_keyboard": true,
    "resize_keyboard" : true
  };
  
  return JSON.parse(fetch(url,{"chat_id":id, "text": text, disable_notification: !notification, "parse_mode": "HTML", "reply_markup": JSON.stringify(keyboard)})).result
}



/**
 * @buttons  array of arrays/array of strings or string
 */
function parseInlineKeyboard(buttons=[[{text:"Öppna i Avanza", url: "asd"}],
    [{text:"abc"}]]){
  if(!Array.isArray(buttons)) buttons = [[buttons]];
  if(!Array.isArray(buttons[0])) buttons = buttons.map(x => [x])
  //parse keys
  for(i in buttons){
    for(j in buttons[i]){
      let x = buttons[i][j]
      if(typeof x === 'string' || typeof x === 'number') buttons[i][j] = {text: x, callback_data: x}
      else if(Object.keys(x).length == 1 && x.text) buttons[i][j] = {text: x.text, callback_data: x.text}
      else if(typeof x.insert_in_chat === 'string'){
        buttons[i][j].switch_inline_query_current_chat = buttons[i][j].insert_in_chat
        delete buttons[i][j].insert_in_chat
        delete buttons[i][j].url
      }
    }
  }
  if(buttons){
    print(JSON.stringify(buttons))
    return JSON.stringify({
      "inline_keyboard": buttons
    });
  }
  else return

}

/**
 * Tar bort svarsalterativ från ett meddelande
 * @param {string=} id - User id
 * @param {string=} messageId - Message id
 */
async function removeMessageInline(id=adminId, messageId){
  var url = botUrl + "/editMessageReplyMarkup?";
    var keyboard = {
    "inline_keyboard": []
  };
  JSON.parse(fetch(url, {"chat_id": id, "message_id": messageId, "reply_markup": JSON.stringify(keyboard)})).result
}

/**
 * Redigerar svarsalterativ i ett meddelande
 * @param {string=} id - User id
 * @param {string=} messageId - Message id
 */
async function editMessageKeyboard(id=adminId, messageId, buttons){
  var url = botUrl + "/editMessageReplyMarkup?";

  JSON.parse(fetch(url, {"chat_id": id, "message_id": messageId, "reply_markup": parseInlineKeyboard(buttons)})).result
}

/**
 * 
 */
function editMessageMedia(id, message, file_id){
  var url = botUrl + "/editMessageMedia?"
  print(message.message_id)
  return JSON.parse(fetch(url, {chat_id:id, 
  message_id: message.message_id,
  parse_mode:"HTML", 
  reply_markup: JSON.stringify(message.reply_markup),
  media: JSON.stringify({type:"photo", media: file_id, caption: message.caption,
  caption_entities:message.caption_entities})
  })).result
}

/**
 * deletes message
 */
function deleteMessage(id, message){
  fetch(botUrl + "/deleteMessage?", {chat_id: id, message_id: message.message_id})
}




/**
 * 
 */
async function sendTypingAnimation(id){
  fetch(botUrl + "/sendChatAction?", {chat_id: id, action: "typing"})
}


/**
 * Skickar sökresultat till användaren baserat på {query}
 * @param {string=} queryId
 * @param {string=} query
 */
function displaySearchResults(queryId, query=""){
  list = searchStocks(query)

  if(!list || list.length == 0) list = getAllUsersWithStockFollowInfo().filter(u => u.id == adminId)[0].follows.map(f => Object({name: f}))

  for(i in list){
    list[i] = {
    type: "article", 
    id: i, 
    title: list[i].name, 
    input_message_content: {message_text: list[i].name}
    }
  }
  url = botUrl + "/answerInlineQuery?"

  fetch(url,{"inline_query_id":queryId, "results": JSON.stringify(list)})
}

/**
 * Tolkar indata från användare
 */
function parseUpdate(e = exampleData){
  var res = {}
  
  let update = JSON.parse(e.postData.contents)
  let callback = update.callback_query
  if(callback){
    res.m = callback.message
    res.id = callback.from.id.toString()
    res.text = res.m.text = callback.data.toLowerCase()
    res.caseSensitive = callback.data
    res.name = callback.from.first_name + " " + callback.from.last_name
    res.message_id = callback.message.message_id
  }
  else if(update.inline_query){
    res.query = update.inline_query.query
    res.id = update.inline_query.from.id.toString()
    res.name = update.inline_query.from.first_name + update.inline_query.from.last_name
    res.query_id = update.inline_query.id
    
  }
  else {
    res.m = update.message
    res.id = res.m.chat.id.toString()
    res.text = res.m.text.toLowerCase()
    res.caseSensitive = res.m.text
  }
  return res
}

function setWebHook(){
  var url = "bot_url";
  var res = UrlFetchApp.fetch(botUrl+"/setWebhook?url="+url+"&allowed_updates=message").getContentText();
  Logger.log(res)
}

function webhookinfo(){
  var res = UrlFetchApp.fetch(botUrl+"/getWebhookInfo").getContentText();
  Logger.log(res)
}


/**
 * command	String -	Text of the command, 1-32 characters. Can contain only lowercase English letters, digits and underscores.
 * description	String -	Description of the command, 3-256 characters.
 */
function setMyCommands(){
  let a = fetch(botUrl + "/setMyCommands?", JSON.stringify([
  {command: "help", description: "Se vad som går att göra"}, 
  {command: "search", description: "Sök på aktier/fonder"},
  {command: "list", description: "Listar aktier/fonder du följer"},
  {command: "settings", description: "Ändra när du får notiser"}]))

  /*help - Se vad som går att göra
  search - Sök på aktier/fonder
  list - Listar aktier/fonder du följer
  settings - Ändra när du får notiser*/

  print(a)
}
