
var userSheetInstance = undefined
/**
 * Stores usersheet if used multiple times
 */
function userSheet(){
  if(!userSheetInstance) userSheetInstance = sheet("users")
  return userSheetInstance
}

/**
 * Adds user to database
 */
function newUser(id = adminId, name) {
  if(userExists(id)) return
  let time = getDate() + " " + getTime()
  let userData = [id, time, time,"[]", name]
  userSheet().insertRowBefore(2).getRange(2, 1, 1, userData.length).setValues([userData]);
}
/**
 * returns true if user exists
 */
function userExists(id){
  return getUserIndex(id) != -1
}

/**
 * returns all users
 */
function getUsers(){
   let users = userSheet().getRange(2, 1, userSheet().getMaxRows(), 1).getValues().filter(x => x != "")
   return users.map(x => x.toString())
}

function getAllUsersWithStockFollowInfo(safemode=false){

  values = sheet("users").getRange(2, 1, sheet("users").getMaxRows(), 4).getValues()
  let users = values.filter(x=>x[0]!="").map(function(u){return {id: u[0].toString(), follows: JSON.parse(u[3])}})
  if(safemode) users = users.filter(u => u.id == adminId)
  return users
}

/**
 * Get the stocks this user is following
 */
function getUserStockData(id=adminId){
  let value = sheet("users").getRange(getUserIndex(id), 4, 1, 1).getValues()[0][0];
  return JSON.parse(value)
}

function addStockToFollowList(id=adminId, stockName="ABC"){
  xs = getUserStockData(id)
  if(xs.includes(stockName)) return
  else{
    xs.push(stockName)
    sheet("users").getRange(getUserIndex(id), 4, 1, 1).getCell(1,1).setValue(JSON.stringify(xs))
  }
}

function removeStockFromFollowList(id=adminId, stockName="ABC"){
  xs = getUserStockData(id)
  i = xs.indexOf(stockName)
  if(i == -1) return
  else{
    xs.splice(i, 1)
    sheet("users").getRange(getUserIndex(id), 4, 1, 1).getCell(1,1).setValue(JSON.stringify(xs))
  }
}

/**
 * update user name
 */
function updateName(id=adminId, name=""){
  let range = userSheet().getRange(getUserIndex(id), 5, 1, 1).getCell(1,1);
  var values = range.getValues()
  values[0][0] = name
  range.setValues(values)

}

async function updateLastSeen(id=adminId){
  let range = userSheet().getRange(getUserIndex(id), 3, 1, 1).getCell(1,1).setValue(getDate()+" " + getTime());
}

/**
 * removes user
 */
function removeUser(id=123){
  userSheet().deleteRow(getUserIndex(id))
}

/**
 * Local database index of user
 * not for common use
 */
function getUserIndex(id=123){
  let users = userSheet().getRange(2, 1, userSheet().getMaxRows(), 1).getValues();
  for(i = 0; i < users.length; i++){
    if(users[i][0] == id) return i+2
  }
  return -1
}
