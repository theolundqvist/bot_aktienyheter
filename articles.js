
var articleSheetInstance = undefined
/**
 * Stores article sheet if used multiple times
 * @returns (SpreadsheetApp.Sheet) articlesheet instance
 */
function articleSheet(){
  if(!articleSheetInstance) articleSheetInstance = sheet("articles")
  return articleSheetInstance
}

/**
 * checks for new articles and adds them to the database
 * {header: , type: , comment: , img: , url: , time: , stocks:[]}
 * @returns {array} all new articles 
 */
function getNewArticles(){
  let articles = downloadArticles()
  let ss = articleSheet()
  let old = readArticles(0, 8)
  //ONLY TODAY
  articles = articles.filter(a => a.time.includes(getDate()))
  //ONLY NEW
  articles = articles.map(x => ((old.findIndex(y => y.header == x.header || y.comment == x.comment) == -1)) ? x : null).filter(x=>x)

  if(articles.length == 0) return undefined

  for(a of articles.reverse()){
    a.stocks = gatherArticleLinkedStocks(a.url)
    writeArticle(a)
  }
  return articles.reverse()
}

/**
 * @param {int} index - which article to read, starting at 0
 * @returns {articleObj}
 */
function readArticle(index = 0){
  return JSON.parse(articleSheet().getRange(index+1, 1, 1, 2).getValues()[0][1] || "{}")  
}

function readArticles(startIndex=0, n=5){
  return sheet("articles").getRange(startIndex+1, 2,n, 1).getValues().map(x => JSON.parse(x[0] || "{}"))
}

/**
 * adds article to database
 * @param {object} articleObj - article data
 */
function writeArticle(articleObj){
  articleSheet().insertRowBefore(1).getRange(1, 1, 1, 2).setValues([[articleObj.time, JSON.stringify(articleObj)]]);
}
