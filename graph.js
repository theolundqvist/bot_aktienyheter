
function createGraph(url, timePeriod = 3){
  if(url.includes("om-fonden.html")) return getFundGraphData(url, timePeriod)
  else if(url.includes("om-aktien.html")) return getStockGraphData(url, timePeriod)
  else return "ange en giltig url"
}


/**
 * @param {int=} timePeriodIndex - index of [one_month, three_months, this_year, one_year, three_years, five_years, infinity]
 */
function getFundGraphData(url = "https://www.avanza.se/fonder/om-fonden.html/2006/handelsbanken-svenska-smabolag-a1-sek", timePeriodIndex){
  let timePeriodArray = "one_month, three_months, one_year, three_years, five_years, infinity".split(", ")
  let timePeriodLabels = "1 m., 3 m., 1 år, 3 år, 5 år, max".split(", ")
  let timePeriod = timePeriodArray[timePeriodIndex]
  let fundId = clip(url, "om-fonden.html/", "/")

  data = JSON.parse(
  fetch(
    "https://www.avanza.se/_api/fund-guide/chart/"+fundId+"/" + timePeriod,{}, "json")
  )
  graphData = data.dataSerie.map(x => [x.y])

  let change = Math.round((graphData[graphData.length-1] - graphData[0])*100)/100
  return {allowedTimePeriods: timePeriodLabels, img: createGraphFromData(graphData, data.name + "\n" + ((change<0)?"-":"+")+change + "%", timePeriod)}
}

/**
 * @param {int=} timePeriodIndex - index of [today, week, month, three_months, this_year, year, three_years]
 */
function getStockGraphData(url = "https://www.avanza.se/aktier/om-aktien.html/238449/tesla-inc", timePeriodIndex, chartResolution = "MINUTE"){
  let timePeriodArray = "today, week, month, three_months, year, three_years".split(", ")
  let timePeriodLabels = "1 d., 1 v., 1 m., 3 m., 1 år, 3 år".split(", ")
  let timePeriod = timePeriodArray[timePeriodIndex]
  let stockId = clip(url, "om-aktien.html/", "/")
  data = JSON.parse(
    fetch(
      "https://www.avanza.se/ab/component/highstockchart/getchart/orderbook", 
      {orderbookId:stockId, chartType:"CANDLESTICK", chartResolution: chartResolution, timePeriod: timePeriod}, 
      "json")
    )
  let change = Math.round(data.changePercent*100)/100
  return {allowedTimePeriods: timePeriodLabels, img: createGraphFromData(data.dataPoints.map(x => [x[3], x[1], x[4],x [2]]), "Utv. " + ((change<0)?"-":"+")+change + "%", timePeriod)}
}

function createGraphFromData(data, title="Utveckling", timeSpan = ""){
  let ss = sheet("graph")
  let cols = (data[0].length == 4) ? 5 : 1
  
  let range = ss.getRange(2, 1, data.length, cols)

  let chartType = (cols == 5)? Charts.ChartType.CANDLESTICK : Charts.ChartType.LINE

  var chart = ss.newChart()
  .setChartType(chartType)
  .addRange(range)
  .setPosition(5, 5, 0, 0)
  .setOption("title", title)
  .setOption("hAxis", {title:timeSpan, titleTextStyle:{bold:true}})
  .setOption("candlestick", {
            fallingColor: { stroke: "#FF1902", fill: '#FF1902' }, // red
            risingColor: { stroke: "#1875FF", fill: '#1875FF' }   // green
          })
  .setOption("chartArea", {width: '100%', height: '80%'})
  .setOption("vAxis", {logScale: (cols == 5)})
  .build();

  if(ss.getCharts().length != 0) ss.removeChart(ss.getCharts()[0])

  if(cols == 5){
    data = data.map(r => [" ", r[0], r[1],r[2], r[3]])
  }
  //print(JSON.stringify(data))
  range.setValues(data)
  ss.insertChart(chart)
  
  return ss.getCharts()[0].getBlob()
}






function yahooUrl(identifier="TSLA"){
  print("https://finance.yahoo.com/chart/"+ identifier+"#eyJpbnRlcnZhbCI6MTUsInBlcmlvZGljaXR5IjoyLCJ0aW1lVW5pdCI6Im1pbnV0ZSIsImNhbmRsZVdpZHRoIjo1LjAwOTk1MDI0ODc1NjIxOSwiZmxpcHBlZCI6ZmFsc2UsInZvbHVtZVVuZGVybGF5Ijp0cnVlLCJhZGoiOnRydWUsImNyb3NzaGFpciI6dHJ1ZSwiY2hhcnRUeXBlIjoiY2FuZGxlIiwiZXh0ZW5kZWQiOmZhbHNlLCJtYXJrZXRTZXNzaW9ucyI6e30sImFnZ3JlZ2F0aW9uVHlwZSI6Im9obGMiLCJjaGFydFNjYWxlIjoicGVyY2VudCIsInBhbmVscyI6eyJjaGFydCI6eyJwZXJjZW50IjowLjQ4MTg4MjM1Mjk0MTE3NjQzLCJkaXNwbGF5IjoiVFNMQSIsImNoYXJ0TmFtZSI6ImNoYXJ0IiwiaW5kZXgiOjAsInlBeGlzIjp7Im5hbWUiOiJjaGFydCIsInBvc2l0aW9uIjpudWxsfSwieWF4aXNMSFMiOltdLCJ5YXhpc1JIUyI6WyJjaGFydCIsIuKAjHZvbCB1bmRy4oCMIl19LCLigIxCb2xsIEJX4oCMICgxMCxDLDIsbWEpIjp7InBlcmNlbnQiOjAuMTU4MTE3NjQ3MDU4ODIzNTMsImRpc3BsYXkiOiLigIxCb2xsIEJX4oCMICgxMCxDLDIsbWEpIiwiY2hhcnROYW1lIjoiY2hhcnQiLCJpbmRleCI6MSwieUF4aXMiOnsibmFtZSI6IuKAjEJvbGwgQlfigIwgKDEwLEMsMixtYSkiLCJwb3NpdGlvbiI6bnVsbH0sInlheGlzTEhTIjpbXSwieWF4aXNSSFMiOlsi4oCMQm9sbCBCV.KAjCAoMTAsQywyLG1hKSJdfSwi4oCMbWFjZOKAjCAoMTIsMjYsOSkiOnsicGVyY2VudCI6MC4xNjAwMDAwMDAwMDAwMDAwMywiZGlzcGxheSI6IuKAjG1hY2TigIwgKDEyLDI2LDkpIiwiY2hhcnROYW1lIjoiY2hhcnQiLCJpbmRleCI6MiwieUF4aXMiOnsibmFtZSI6IuKAjG1hY2TigIwgKDEyLDI2LDkpIiwicG9zaXRpb24iOm51bGx9LCJ5YXhpc0xIUyI6W10sInlheGlzUkhTIjpbIuKAjG1hY2TigIwgKDEyLDI2LDkpIl19LCLigIxPbiBCYWwgVm9s4oCMIjp7InBlcmNlbnQiOjAuMjAwMDAwMDAwMDAwMDAwMDQsImRpc3BsYXkiOiLigIxPbiBCYWwgVm9s4oCMIiwiY2hhcnROYW1lIjoiY2hhcnQiLCJpbmRleCI6MywieUF4aXMiOnsibmFtZSI6IuKAjE9uIEJhbCBWb2zigIwiLCJwb3NpdGlvbiI6bnVsbH0sInlheGlzTEhTIjpbXSwieWF4aXNSSFMiOlsi4oCMT24gQmFsIFZvbOKAjCJdfX0sInNldFNwYW4iOm51bGwsImxpbmVXaWR0aCI6Miwic3RyaXBlZEJhY2tncm91bmQiOnRydWUsImV2ZW50cyI6dHJ1ZSwiY29sb3IiOiIjMDA4MWYyIiwic3RyaXBlZEJhY2tncm91ZCI6dHJ1ZSwicmFuZ2UiOm51bGwsImV2ZW50TWFwIjp7ImNvcnBvcmF0ZSI6eyJkaXZzIjp0cnVlLCJzcGxpdHMiOnRydWV9LCJzaWdEZXYiOnt9fSwic3ltYm9scyI6W3sic3ltYm9sIjoiVFNMQSIsInN5bWJvbE9iamVjdCI6eyJzeW1ib2wiOiJUU0xBIiwicXVvdGVUeXBlIjoiRVFVSVRZIiwiZXhjaGFuZ2VUaW1lWm9uZSI6IkFtZXJpY2EvTmV3X1lvcmsifSwicGVyaW9kaWNpdHkiOjIsImludGVydmFsIjoxNSwidGltZVVuaXQiOiJtaW51dGUiLCJzZXRTcGFuIjpudWxsfSx7InN5bWJvbCI6IlNEQiIsInN5bWJvbE9iamVjdCI6eyJzeW1ib2wiOiJTREIifSwicGVyaW9kaWNpdHkiOjIsImludGVydmFsIjoxNSwidGltZVVuaXQiOiJtaW51dGUiLCJzZXRTcGFuIjpudWxsLCJpZCI6IlNEQiIsInBhcmFtZXRlcnMiOnsiY29sb3IiOiIjMWFjNTY3IiwiaXNDb21wYXJpc29uIjp0cnVlLCJzaGFyZVlBeGlzIjp0cnVlLCJjaGFydE5hbWUiOiJjaGFydCIsInN5bWJvbE9iamVjdCI6eyJzeW1ib2wiOiJTREIifSwicGFuZWwiOiJjaGFydCIsImZpbGxHYXBzIjpmYWxzZSwiYWN0aW9uIjoiYWRkLXNlcmllcyIsInN5bWJvbCI6IlNEQiIsImdhcERpc3BsYXlTdHlsZSI6InRyYW5zcGFyZW50IiwibmFtZSI6IlNEQiIsIm92ZXJDaGFydCI6dHJ1ZSwidXNlQ2hhcnRMZWdlbmQiOnRydWUsImhlaWdodFBlcmNlbnRhZ2UiOjAuNywib3BhY2l0eSI6MSwiaGlnaGxpZ2h0YWJsZSI6dHJ1ZSwidHlwZSI6ImxpbmUiLCJzdHlsZSI6InN0eF9saW5lX2NoYXJ0IiwiaGlnaGxpZ2h0IjpmYWxzZX19XSwiY3VzdG9tUmFuZ2UiOm51bGwsInN0dWRpZXMiOnsi4oCMdm9sIHVuZHLigIwiOnsidHlwZSI6InZvbCB1bmRyIiwiaW5wdXRzIjp7ImlkIjoi4oCMdm9sIHVuZHLigIwiLCJkaXNwbGF5Ijoi4oCMdm9sIHVuZHLigIwifSwib3V0cHV0cyI6eyJVcCBWb2x1bWUiOiIjMDBiMDYxIiwiRG93biBWb2x1bWUiOiIjZmYzMzNhIn0sInBhbmVsIjoiY2hhcnQiLCJwYXJhbWV0ZXJzIjp7IndpZHRoRmFjdG9yIjowLjQ1LCJjaGFydE5hbWUiOiJjaGFydCIsInBhbmVsTmFtZSI6ImNoYXJ0In19LCLigIxtYeKAjCAoNTAsQyxtYSwwKSI6eyJ0eXBlIjoibWEiLCJpbnB1dHMiOnsiUGVyaW9kIjo1MCwiRmllbGQiOiJDbG9zZSIsIlR5cGUiOiJzaW1wbGUiLCJPZmZzZXQiOjAsImlkIjoi4oCMbWHigIwgKDUwLEMsbWEsMCkiLCJkaXNwbGF5Ijoi4oCMbWHigIwgKDUwLEMsbWEsMCkifSwib3V0cHV0cyI6eyJNQSI6IiNhZDZlZmYifSwicGFuZWwiOiJjaGFydCIsInBhcmFtZXRlcnMiOnsiY2hhcnROYW1lIjoiY2hhcnQiLCJwYW5lbE5hbWUiOiJjaGFydCJ9fSwi4oCMbWHigIwgKDUwLEMsbWEsMCktMiI6eyJ0eXBlIjoibWEiLCJpbnB1dHMiOnsiUGVyaW9kIjo1MCwiRmllbGQiOiJDbG9zZSIsIlR5cGUiOiJzaW1wbGUiLCJPZmZzZXQiOjAsImlkIjoi4oCMbWHigIwgKDUwLEMsbWEsMCktMiIsImRpc3BsYXkiOiLigIxtYeKAjCAoNTAsQyxtYSwwKS0yIn0sIm91dHB1dHMiOnsiTUEiOiIjYWQ2ZWZmIn0sInBhbmVsIjoiY2hhcnQiLCJwYXJhbWV0ZXJzIjp7ImNoYXJ0TmFtZSI6ImNoYXJ0IiwicGFuZWxOYW1lIjoiY2hhcnQifX0sIuKAjG1h4oCMICgxMDAsQyxtYSwwKSI6eyJ0eXBlIjoibWEiLCJpbnB1dHMiOnsiUGVyaW9kIjoiMTAwIiwiRmllbGQiOiJDbG9zZSIsIlR5cGUiOiJzaW1wbGUiLCJPZmZzZXQiOjAsImlkIjoi4oCMbWHigIwgKDEwMCxDLG1hLDApIiwiZGlzcGxheSI6IuKAjG1h4oCMICgxMDAsQyxtYSwwKSJ9LCJvdXRwdXRzIjp7Ik1BIjoiI2FkNmVmZiJ9LCJwYW5lbCI6ImNoYXJ0IiwicGFyYW1ldGVycyI6eyJjaGFydE5hbWUiOiJjaGFydCIsInBhbmVsTmFtZSI6ImNoYXJ0In19LCLigIxtYeKAjCAoMjAsQyxtYSwwKSI6eyJ0eXBlIjoibWEiLCJpbnB1dHMiOnsiUGVyaW9kIjoiMjAiLCJGaWVsZCI6IkNsb3NlIiwiVHlwZSI6InNpbXBsZSIsIk9mZnNldCI6MCwiaWQiOiLigIxtYeKAjCAoMjAsQyxtYSwwKSIsImRpc3BsYXkiOiLigIxtYeKAjCAoMjAsQyxtYSwwKSJ9LCJvdXRwdXRzIjp7Ik1BIjoiI2FkNmVmZiJ9LCJwYW5lbCI6ImNoYXJ0IiwicGFyYW1ldGVycyI6eyJjaGFydE5hbWUiOiJjaGFydCIsInBhbmVsTmFtZSI6ImNoYXJ0In19LCLigIxtYeKAjCAoMjAwLEMsbWEsMCkiOnsidHlwZSI6Im1hIiwiaW5wdXRzIjp7IlBlcmlvZCI6IjIwMCIsIkZpZWxkIjoiQ2xvc2UiLCJUeXBlIjoic2ltcGxlIiwiT2Zmc2V0IjowLCJpZCI6IuKAjG1h4oCMICgyMDAsQyxtYSwwKSIsImRpc3BsYXkiOiLigIxtYeKAjCAoMjAwLEMsbWEsMCkifSwib3V0cHV0cyI6eyJNQSI6IiNhZDZlZmYifSwicGFuZWwiOiJjaGFydCIsInBhcmFtZXRlcnMiOnsiY2hhcnROYW1lIjoiY2hhcnQiLCJwYW5lbE5hbWUiOiJjaGFydCJ9fSwi4oCMQm9sbCBCV.KAjCAoMTAsQywyLG1hKSI6eyJ0eXBlIjoiQm9sbCBCVyIsImlucHV0cyI6eyJQZXJpb2QiOiIxMCIsIkZpZWxkIjoiQ2xvc2UiLCJTdGFuZGFyZCBEZXZpYXRpb25zIjoyLCJNb3ZpbmcgQXZlcmFnZSBUeXBlIjoic2ltcGxlIiwiaWQiOiLigIxCb2xsIEJX4oCMICgxMCxDLDIsbWEpIiwiZGlzcGxheSI6IuKAjEJvbGwgQlfigIwgKDEwLEMsMixtYSkifSwib3V0cHV0cyI6eyJCYW5kd2lkdGgiOiIjMDAwMDAwIn0sInBhbmVsIjoi4oCMQm9sbCBCV.KAjCAoMTAsQywyLG1hKSIsInBhcmFtZXRlcnMiOnsiY2hhcnROYW1lIjoiY2hhcnQiLCJwYW5lbE5hbWUiOiLigIxCb2xsIEJX4oCMICgxMCxDLDIsbWEpIn19LCLigIxtYeKAjCAoMjAsQyxtYSwwKS0yIjp7InR5cGUiOiJtYSIsImlucHV0cyI6eyJQZXJpb2QiOiIyMCIsIkZpZWxkIjoiQ2xvc2UiLCJUeXBlIjoic2ltcGxlIiwiT2Zmc2V0IjowLCJpZCI6IuKAjG1h4oCMICgyMCxDLG1hLDApLTIiLCJkaXNwbGF5Ijoi4oCMbWHigIwgKDIwLEMsbWEsMCktMiJ9LCJvdXRwdXRzIjp7Ik1BIjoiI2FkNmVmZiJ9LCJwYW5lbCI6ImNoYXJ0IiwicGFyYW1ldGVycyI6eyJjaGFydE5hbWUiOiJjaGFydCIsInBhbmVsTmFtZSI6ImNoYXJ0In19LCLigIxtYWNk4oCMICgxMiwyNiw5KSI6eyJ0eXBlIjoibWFjZCIsImlucHV0cyI6eyJGYXN0IE1BIFBlcmlvZCI6MTIsIlNsb3cgTUEgUGVyaW9kIjoyNiwiU2lnbmFsIFBlcmlvZCI6OSwiaWQiOiLigIxtYWNk4oCMICgxMiwyNiw5KSIsImRpc3BsYXkiOiLigIxtYWNk4oCMICgxMiwyNiw5KSJ9LCJvdXRwdXRzIjp7Ik1BQ0QiOiIjYWQ2ZWZmIiwiU2lnbmFsIjoiI2ZmYTMzZiIsIkluY3JlYXNpbmcgQmFyIjoiIzc5ZjRiZCIsIkRlY3JlYXNpbmcgQmFyIjoiI2ZmODA4NCJ9LCJwYW5lbCI6IuKAjG1hY2TigIwgKDEyLDI2LDkpIiwicGFyYW1ldGVycyI6eyJjaGFydE5hbWUiOiJjaGFydCIsInBhbmVsTmFtZSI6IuKAjG1hY2TigIwgKDEyLDI2LDkpIn19LCLigIxPbiBCYWwgVm9s4oCMIjp7InR5cGUiOiJPbiBCYWwgVm9sIiwiaW5wdXRzIjp7ImlkIjoi4oCMT24gQmFsIFZvbOKAjCIsImRpc3BsYXkiOiLigIxPbiBCYWwgVm9s4oCMIn0sIm91dHB1dHMiOnsiUmVzdWx0IjoiIzAwMDAwMCJ9LCJwYW5lbCI6IuKAjE9uIEJhbCBWb2zigIwiLCJwYXJhbWV0ZXJzIjp7ImNoYXJ0TmFtZSI6ImNoYXJ0IiwicGFuZWxOYW1lIjoi4oCMT24gQmFsIFZvbOKAjCJ9fSwi4oCMbWHigIwgKDY2LFJlc3VsdCDigIxPbiBCYWwgVm9s4oCMLG1hLDApIjp7InR5cGUiOiJtYSIsImlucHV0cyI6eyJQZXJpb2QiOiI2NiIsIkZpZWxkIjoiUmVzdWx0IOKAjE9uIEJhbCBWb2zigIwiLCJUeXBlIjoic2ltcGxlIiwiT2Zmc2V0IjowLCJpZCI6IuKAjG1h4oCMICg2NixSZXN1bHQg4oCMT24gQmFsIFZvbOKAjCxtYSwwKSIsImRpc3BsYXkiOiLigIxtYeKAjCAoNjYsUmVzdWx0IOKAjE9uIEJhbCBWb2zigIwsbWEsMCkifSwib3V0cHV0cyI6eyJNQSI6IiNhZDZlZmYifSwicGFuZWwiOiLigIxPbiBCYWwgVm9s4oCMIiwicGFyYW1ldGVycyI6eyJjaGFydE5hbWUiOiJjaGFydCIsInBhbmVsTmFtZSI6IuKAjE9uIEJhbCBWb2zigIwifX19fQ--")
}








