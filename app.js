const firebaseConfig = {
  apiKey: "AIzaSyBgaIaZQtCnYvVnDJ9WSGjAdJ25gJBVSew",
  databaseURL: "https://chefystudios-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const API_KEY = "45DLCNXW243G8DOL";

let userNow;
let currentPrice = 0;
let chart;

// LOGIN
function login(){
 userNow = document.getElementById("user").value;

 db.ref("users/"+userNow).once("value",snap=>{
  if(!snap.exists()){
   db.ref("users/"+userNow).set({
    balance:10000,
    portfolio:{}
   });
  }

  document.getElementById("app").style.display="block";
  loadUser();
  loadStock("AAPL");
 });
}

// LOAD USER DATA
function loadUser(){
 db.ref("users/"+userNow).on("value",snap=>{
  let d = snap.val();

  document.getElementById("bal").innerText = d.balance;

  let html="";
  for(let s in d.portfolio){
   html += `${s}: ${d.portfolio[s]}<br>`;
  }
  document.getElementById("portfolio").innerHTML = html;
 });
}

// LOAD STOCK
async function loadStock(symbol){
 const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

 const res = await fetch(url);
 const data = await res.json();

 const raw = data["Time Series (5min)"];
 const candles = [];

 for(let t in raw){
  candles.push({
   x:new Date(t),
   o:+raw[t]["1. open"],
   h:+raw[t]["2. high"],
   l:+raw[t]["3. low"],
   c:+raw[t]["4. close"]
  });
 }

 candles.reverse();

 currentPrice = candles[candles.length-1].c;

 if(chart) chart.destroy();

 chart = new Chart(document.getElementById("chart"),{
  type:'candlestick',
  data:{datasets:[{data:candles}]}
 });
}

// BUY
function buy(){
 let stock = document.getElementById("stock").value;

 db.ref("users/"+userNow).once("value",snap=>{
  let d = snap.val();

  if(d.balance < currentPrice){
   alert("Not enough money");
   return;
  }

  db.ref("users/"+userNow+"/balance").set(d.balance - currentPrice);
  db.ref("users/"+userNow+"/portfolio/"+stock)
    .set((d.portfolio?.[stock]||0)+1);
 });
}

// SELL
function sell(){
 let stock = document.getElementById("stock").value;

 db.ref("users/"+userNow).once("value",snap=>{
  let d = snap.val();

  let qty = d.portfolio?.[stock]||0;

  if(qty<=0){
   alert("No stock");
   return;
  }

  db.ref("users/"+userNow+"/balance").set(d.balance + currentPrice);
  db.ref("users/"+userNow+"/portfolio/"+stock).set(qty-1);
 });
}

// CHANGE STOCK
document.getElementById("stock").onchange = (e)=>{
 loadStock(e.target.value);
};
