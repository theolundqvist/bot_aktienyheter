

/**
 * faster if used more than once
 * @param {string=} searchStr
 * @returns {array=} list of search results
 */
function searchStocksLocal(searchStr="handelsbanken"){
  var list = [],
    filteredList = [],
    maxDisplayLimit = 10

  textMatch = (item) => item.toLowerCase().indexOf(searchStr.toLowerCase()) !== -1
  compare = (a, b) => a.toLowerCase().indexOf(searchStr.toLowerCase()) - b.toLowerCase().indexOf(searchStr.toLowerCase())
  
  var ss = sheet("stocklist")
  list = ss.getRange(1, 1, ss.getMaxRows(), 1).getValues().map(x => x[0])
  filteredList = list.filter(textMatch).slice(0, maxDisplayLimit).sort(compare)

  return (filteredList)
}

/**
 * faster if used once
 * @param {string=} query
 * @returns {array=} list of search results
 */
function searchStocksGoogleQuery(query="milli"){
    // SQL like query
    let myQuery = "SELECT * WHERE " + "lower(A) contains lower('"+ query +"')";
    let displayLimit = 10
    compare = (a, b) => a.toLowerCase().indexOf(query.toLowerCase()) - b.toLowerCase().indexOf(query.toLowerCase())
    // the query URL
    // don't provide last row in range selection
    var qvizURL = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json&sheet=stocklist&tq=' + encodeURIComponent(myQuery);


    // fetch the data
    var ret = UrlFetchApp.fetch(qvizURL, {headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}}).getContentText();
    let data = JSON.parse(ret.replace("/*O_o*/", "").replace("google.visualization.Query.setResponse(", "").slice(0, -2)).table
    if(!data) return []
    // remove some crap from the return string
    return Array.from(data.rows).map(a => a.c[0].v).slice(0, displayLimit).sort(compare)

}

/**
 * request to avanza
 */
function searchStocks(query=""){
  if(!query) {return []}
  let URL = "https://www.avanza.se/ab/sok/inline?query=" + query
  let html = UrlFetchApp.fetch(URL).getContentText().replace(/&/g, "OCHTECKEN")
  if(html.slice(50, 50 + "Du fick inga träffar.".length) == "Du fick inga träffar.") {return []}
  results = XmlService.parse(html).getAllContent()[0].asElement().getChildren()
  xs = []
  getClass = (e) => e.getAttribute("class").getValue()
  results = results.filter(r => getClass(r) == "srchItem")
  for(r of results){
    let o = r.getChildren()[0].getChildren()[0].getChildren().filter(c => getClass(c).includes("srchResLink"))[0]
    let link = o.getAttribute("href").getValue().replace(/OCHTECKEN/g,"&")
    if(link.includes("om-aktien.html") || link.includes("om-fonden.html")){
      let name = removeBetween(o.getValue().replace(/OCHTECKEN/g,"&")," (",")")
      xs.push({name: name, url: url + link})
    }
  }
  return xs
}

function testSearchFunctions(){
  let querys = ["millicom", "invest", "tesl", "asdads", "", "pan", "pandox", "investor A", "INVE"]
  let ss = sheet("stocklist")
      rows = ss.getMaxRows()
  let values = ss.getRange(1,1, rows, 1).getValues()
  /*print(values[1][0])*/

  /*for(i = 0; i<5; i++){
    rand = (a) => Math.floor(Math.random()*a)
    let v = values[rand(rows)][0]
    querys.push(v.slice(rand(v.length/4), rand(v.length)))
  }*/
  var m1 = []
  var m2 = []
  var m3 = []

  for(q of querys){
    print(q)
    var fast = timeFunc(searchStocksLocal, q)
    var slow = timeFunc(searchStocksGoogleQuery, q)
    var avanzaSearch= timeFunc(searchStocks, q)
    print("m1: " + slow.t + "\nm2: " + fast.t + "\nm3: " + avanzaSearch.t)
    if(fast.value.length != slow.value.length || slow.value.length != avanzaSearch.value.length){
      print("length: \nm2 " + fast.value.length + "\nm1: " + slow.value.length + "\nm3: " + avanzaSearch.value.length)
      print("search: " + q + "\nm2: " + fast.value + "\nm1: " + slow.value + "\nm3: " + avanzaSearch.value.map(x => x.name))

    }
    m1.push(fast.t)
    m2.push(slow.t)
    m3.push(avanzaSearch.t)
    
  }
  const sum1 = m1.reduce((a, b) => a + b, 0);
  const avg1 = (sum1 / m1.length) || 0;
  
  const sum2 = m2.reduce((a, b) => a + b, 0);
  const avg2 = (sum2 / m2.length) || 0;

    const sum3 = m3.reduce((a, b) => a + b, 0);
  const avg3 = (sum3 / m3.length) || 0;
  print("slow method avg: " + avg2 + "\nfast method avg: " + avg1 + "avanza search: " + avg3)
}














