// Store a reference to the <h1> in a variable
//const myHeading = document.querySelector("h1");
// Update the text content of the <h1>
//myHeading.textContent = "這是我們教會試用網站!";
//這是註記
const myImage = document.querySelector("img");
myImage.addEventListener("click", () => {
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "images/a1.jpg") {
    myImage.setAttribute("src", "images/a2.jpg");
  } else {
    myImage.setAttribute("src", "images/a1.jpg");
  }
});
//
let myButton = document.querySelector("button");
let myHeading = document.querySelector("h1");
function setUserName() {
  const myName = prompt("請輸入名字.");
  localStorage.setItem("name", myName);
  myHeading.textContent = `My church is cool, ${myName}`;
}
if (!localStorage.getItem("name")) {
  setUserName();
} else {
  const storedName = localStorage.getItem("name");
  myHeading.textContent = `My Church is cool, ${storedName}`;
}
myButton.addEventListener("click", () => {
  setUserName();
});