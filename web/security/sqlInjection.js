function detectSQLInjection(input){

 const patterns = [
  "'",
  "--",
  ";",
  " OR ",
  " AND ",
  " DROP ",
  " SELECT ",
  " INSERT ",
  " DELETE ",
  " UPDATE "
 ]

 input = input.toUpperCase()

 for(let i=0;i<patterns.length;i++){
  if(input.includes(patterns[i])){
   return true
  }
 }

 return false

}