let url = "https://www.avanza.se"
let telegramUrl = url + "/placera/telegram.html"
let pressmeddelandenUrl = url + "/placera/pressmeddelanden.html"
let uppdragsanalyserUrl = url + "/placera/ovriga-nyheter.html"
function gatherTelegramList(URL){
  let page = UrlFetchApp.fetch(URL).getContentText()

  var list = page.slice(page.indexOf('<ul class="feedArticleList'))
  list=list.slice(0, list.indexOf('</ul>')+6).replace(/&/g, "OCHTECKEN")

  elementList = XmlService.parse(list).getAllContent()[0].asElement().getChildren()
  var xs = []
  for(e of elementList){
    let u = e.getChildren()[0].getAttribute("href").getValue()
    let d = removeSpaces(e.getValue()).replace("OCHTECKEN", "&")
    let t = removeSpaces(d.slice(-18))
    d = removeSpaces(d.slice(0, -20))
    let index = d.indexOf(": ")
    let text = d.slice(index+2)

    xs.push({header:d.slice(0, index), comment:text, url: url + u, time:t})
  }
  return xs
}

function downloadTelegrams(){
  compareTime = (a, b)  => b.time.slice(11).replace(":","") - a.time.slice(11).replace(":","")

  var news = gatherTelegramList(telegramUrl)
  news = news.concat(gatherTelegramList(pressmeddelandenUrl))
  news = news.concat(gatherTelegramList(uppdragsanalyserUrl))

  news = news.filter(x => x.time.includes(getDate()))
  news.sort(compareTime)
  return news
}



function downloadArticles(){
  compareTime = (a, b)  => b.time.slice(11).replace(":","") - a.time.slice(11).replace(":","")
  var articles = gatherArticleData()
  articles.sort(compareTime)
  return articles
}


function gatherArticleData(){

  let page = UrlFetchApp.fetch("https://www.avanza.se/placera/forstasidan.html").getContentText()

  var html = page.substring(page.indexOf('<div class="column grid_9 halfWidthPuffColumn">'), page.indexOf('<div class="column grid_5">'))

  html=html.replace(/&/g, "OCHTECKEN")
  html = closeImgTags(html)
  //print(removeSpaces(html))
  elementList = XmlService.parse(html).getAllContent()[0].asElement().getChildren()
  
  var xs = []
  for(a of elementList){
    let e = a.getChildren()[0]
    let className = e.getAttribute("class").getValue()
    if(className.includes("articlePuff") || className.includes("personalPuff")){
      let index = 0
      if(className.includes("personalPuff")){ index = 1 }
      let img = undefined
      if(e.getChildren()[index].getChildren()[0].getChildren().length != 0){
        img = url + e.getChildren()[index].getChildren()[0].getChildren()[0].getAttribute("src").getValue()}

      let link = url + e.getChildren()[index + 1].getChildren()[0].getAttribute("href").getValue()
      let header = e.getChildren()[index + 1].getChildren()[0].getValue().replace("OCHTECKEN", "&").replace("&ouml;", "ö")
      let type = e.getChildren()[index + 2].getChildren()[0].getValue().replace("OCHTECKEN", "&")
      let comment = e.getChildren()[index + 2].getValue().slice(type.length+1).replace("OCHTECKEN", "&")

      let t = e.getChildren()[index + 4].getValue().replace("I dag", getDate()).replace("I går", getDate(-1))
      //print(img, link, header, type, comment)
      xs.push({header: header, type: type, comment: comment, img: img, url: link, time: t})
    }
  }
  //xs = xs.filter(x => x.time.includes(getDate()))
  return xs
}

function gatherArticleLinkedStocks(url){
  let html = UrlFetchApp.fetch(url).getContentText()

  let endIndex1 = html.indexOf('<div class="module')
  let endIndex2 = html.indexOf('<ul class="articlePrintShare')
  if(endIndex1 == -1) endIndex1 = 0
  if(endIndex2 == -1) endIndex2 = 0

  let endIndex = (endIndex1 > endIndex2) ? endIndex2: endIndex1

  stockHtml = html.substring(html.indexOf('<div class="articleChartData">'), endIndex).slice(0, -12) //tar bort en överbliven </div>
  
  let replaceXs = ["-", "Idag:", "Senast:", "K S "]
  var text = removeSpaces(htmlToText(stockHtml))
  replaceXs.forEach(r => text = text.replace(new RegExp(r, "g"), ""))
  xs = text.split("  ").filter(x => x != "").map(x => removeSpaces(x))

  if(xs.join().length > 1500) return undefined
  return xs
}

function gatherTelegramLinkedStocks(url){
  let sStr = "section graph"
  let data = fetch(url)
  let text = data.slice(data.indexOf(sStr))

  let xs = []
  while(true){
    let index = text.indexOf("forumChartWrapper")
    if(index == -1) return xs;
    text = text.slice(index+1)
    xs.push(clip(text, 'XLText">', " - I dag"))
  }

}

/**
 * get todays stock value change in percent
 * @param {string=} url - url to stock homepage
 */
function getStockPriceChange(url="https://www.avanza.se/fonder/om-fonden.html/512559/handelsbanken-hallbar-energi-a1-sek"){
  let html = ""
  if(url.includes("om-fonden.html")){
    url = url.slice(url.indexOf("html") + 5)
    url = "https://www.avanza.se/_api/fund-guide/guide/" + url.slice(0, url.indexOf("/"))
    change = JSON.parse(UrlFetchApp.fetch(url).getContentText()).developmentOneDay
    change = Math.round(change*100)/100 + " %"
  }
  else{
    html = UrlFetchApp.fetch(url).getContentText()
    html = html.slice(html.indexOf("changePercent"))
    change = html.slice(html.indexOf(">")+1, html.indexOf("</span>"))
  }
  return change
}



function closeImgTags(html){
  var lastIdx = 0
  for(i = 0; i < 200; i++){  
    let idx = html.indexOf("<img",lastIdx)
    let endIdx = idx + html.slice(idx).indexOf(">")
    if(idx < 0) break;
    if(html[endIdx-1] != "/"){
      html = html.slice(0, endIdx) + "/" + html.slice(endIdx)
    }
    lastIdx = endIdx
  }
  return html
}

function gatherTextFromHtmlPath(html, path, end){
  var text = html
  for(p in path) { 
    text = text.slice(text.search(path[p]), text.length-1)
  }
  text = text.slice(0, text.search(end))
  return htmlToText(text)
}

function htmlToText(text){
  return removeSpaces(removeBetween(text, "<", ">").replace(/  +/g, ' ').replace(/[\r\n]+/gm, ''));
}

function removeSpaces(text){
  return text.replace(/  +/g, ' ').replace(/[\r\n]+/gm, '').trim()
}

function removeBetween(text, start, end){
  var count = 0
  while(count < 10000)
  {
    var s = text.indexOf(start)
    var e = text.indexOf(end)
    if(e == -1 || s == -1) return text
    var temp = ""
    if(s != 0) temp = text.slice(0, s) 
    text = temp + text.slice(e+1, text.length)
    count++
  }
  return text
}



function getAllStocks(){
  var startIndex = 0
  let maxRes = 300
  apiUrl = () => 'https://www.avanza.se/frontend/template.html/marketing/advanced-filter/advanced-filter-template?1608922929169&widgets.marketCapitalInSek.filter.lower=&widgets.marketCapitalInSek.filter.upper=&widgets.marketCapitalInSek.active=true&widgets.stockLists.filter.list%5B0%5D=SE.LargeCap.SE&widgets.stockLists.active=false&widgets.numberOfOwners.filter.lower=&widgets.numberOfOwners.filter.upper=&widgets.numberOfOwners.active=true&parameters.startIndex='+ startIndex +'&parameters.maxResults='+ maxRes +'&parameters.selectedFields%5B0%5D=LATEST&parameters.selectedFields%5B1%5D=DEVELOPMENT_TODAY&parameters.selectedFields%5B2%5D=DEVELOPMENT_ONE_YEAR&parameters.selectedFields%5B3%5D=MARKET_CAPITAL_IN_SEK&parameters.selectedFields%5B4%5D=PRICE_PER_EARNINGS&parameters.selectedFields%5B5%5D=DIRECT_YIELD&parameters.selectedFields%5B6%5D=NBR_OF_OWNERS&parameters.selectedFields%5B7%5D=LIST'

    xs = []

  for(i = 0; i < 40; i++){
    startIndex = maxRes * i
    url = apiUrl()
    html = UrlFetchApp.fetch(url).getContentText()
    html = html.substring(html.indexOf("<tbody>"), html.indexOf("</table>"))
    for(y = 0; y < maxRes; y++){
      text = html.slice(html.indexOf("rowId"+y))
      text = text.slice(text.indexOf("ellipsis"))
      let stockUrl = text.slice(text.indexOf("href=") + 6, text.indexOf(">")-1)
      text = text.slice(text.indexOf("</span>")+7)
      text = removeSpaces(text.substring(0, text.indexOf("</a>")))
      if(text != xs.slice(-1))
      xs.push([text])
    }
    print(i, "stocks: " + xs.length)
  }
  sheet("stocks").getRange(1,1, xs.length, 1).setValues(xs)

}



function getIdentifier(url="https://www.avanza.se/aktier/om-aktien.html/238449/tesla-inc"){
  let text = clip(UrlFetchApp.fetch(url).getContentText(), "Kortnamn", "/dd")
  return clip(text,"<span>", "</span>")
}









