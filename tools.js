
function htmlOK(){
  return HtmlService.createHtmlOutput('header("HTTP/1.1 200 OK");'); 
}


/**
 * @returns yyyy:mm:dd
 */
function getDate(offset = 0){
  let t = new Date()
  t.setDate(t.getDate() + offset);
  let m = t.getMonth()+1
  let d = t.getDate()
  return t.getFullYear() + "-" + ((m<10)?"0"+m:m) + "-" + ((d<10)?"0"+d:d)
}

/**
 * @returns h:m:s
 */
function getTime(){
  let t = new Date()
  let h = ("0"+(t.getUTCHours()+1)%24).slice(-2)
  let m = ("0"+t.getUTCMinutes()).slice(-2)
  let s = ("0"+t.getUTCSeconds()).slice(-2)
  return ([h,m,s].join(":"))
}

/**
 * start!/end!/time?=now must be "h:m:s"
 */
function withinTimeInterval(start="07:30:00", end="21:30:00", time="22:00:00"){
  s = start.split(":").map(x=>parseInt(x))
  e = end.split(":").map(x=>parseInt(x))
  t = (time || getTime()).split(":").map(x=>parseInt(x))
  for(i in s){
    if(t[i] < s[i] || t[i] > e[i]) print(false)
  }
  print(true)
}


function nextInt(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}




var isNumber = function isNumber(value) 
{
   return typeof value === "number" && isFinite(value);
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function print() {
  var text = ""
  for (var i = 0; i < arguments.length-1; i++) {
    text += arguments[i] + ", "
  }
  text += arguments[arguments.length-1]
  Logger.log(text)
}


function clip(str, start, end){
  let s = str.slice(str.indexOf(start) + start.length)
  return s.slice(0, s.indexOf(end))
}


function fetch(url, data=undefined, type){
  switch(type){
    case "html": type = "text/html"; break;
    case "json": type = "application/json"; data = JSON.stringify(data); break;
    case "form": type = "multipart/form-data"; break;
  }
  var options = {
    method: (data) ? "POST" : "GET", 
    contentType:type,
    payload: data
  }
  //var request = UrlFetchApp.getRequest(url,options);   // (OPTIONAL) generate the request so you
  //log("Request payload: " + request.payload); 
  var response = UrlFetchApp.fetch(url,options);
  //log(response.getContentText());
  return response.getContentText()
}

async function log(text){
  var logSheet = sheet("log")
  logSheet.insertRowBefore(1).getRange(1, 1, 1, 2).setValues([[getDate() +" "+ getTime(), text]]);
}

async function runAsync(func, arguments){
  func(arguments)
}


timeFunc = (func, query) => {
  let t = new Date().getTime()
  let r = func(query)
  return {t: new Date().getTime()-t, value: r}
}
