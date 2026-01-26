// Store a reference to the <h1> in a variable
//const myHeading = document.querySelector("h1");
// Update the text content of the <h1>
//myHeading.textContent = "Hello world!";
const myImage = document.querySelector("img");
myImage.addEventListener("click", () => {
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "images/a1.jpg") {
    myImage.setAttribute("src", "images/church.jpg");
  } else {
    myImage.setAttribute("src", "images/a1.jpg");
  }
});
let myButton = document.querySelector("button");
let myHeading = document.querySelector("h1");
function setUserName() {
  const myName = prompt("請輸入");
  if (myName === null) {
  console.log("已經取消.");
  // Perform actions for cancellation, e.g., stop further processing
} else if (myName === "") {
  console.log("User clicked OK but entered no text.");
  // Handle empty input
} else {
  console.log("User entered: " + myName);
  // Process the user's input
}
  if (!myName) {
    //setUserName();
    myHeading.textContent = `No input, please click button again`;
  } else {
    localStorage.setItem("name", myName);
    myHeading.textContent = `My Church is cool, ${myName}`;
  }
}
myButton.onclick = () => {
  setUserName();
};
